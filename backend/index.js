import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import userRout from "./routes/userRout.js";
import sequelize from "./dbconnection.js";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import CustomerRoute from "./routes/CustomersRoute.js";
import OrderItemRoute from "./routes/OrderItemsRoute.js";
import IncomeRoute from "./routes/StockIncomeRoute.js";
import OutgoingRoute from "./routes/OutgoingRoute.js";
import ExistRoute from "./routes/ExistRoute.js";
import RemainRoute from "./routes/RemainRoute.js";
import ExpenseRoute from "./routes/ExpenseRoute.js";
import StaffRoute from "./routes/StaffRoute.js";
import AttendenceRoute from "./routes/AttendenceRoute.js";
import ReceiptRoute from "./routes/ReceiptRoute.js";
import OwnerRoute from "./routes/OwnerRoute.js";
import MoneyRoute from "./routes/MoneyRoute.js";
import ReportRoute from "./routes/Reportroute.js";
import CompanyStockRoute from "./routes/CompanStockRoute.js";
import PalletRoute from "./routes/PalletRoute.js";
import SellerRoute from "./routes/Seller/SellerRoute.js";
import SellerAccountRoute from "./routes/Seller/SellerAccountRoute.js";
import PayRoute from "./routes/finance/PayRoute.js";
import FactorRouter from "./routes/finance/FactorRouter.js";
import databaseRoute from "./routes/databaseRoute.js";
import mysql from "mysql2/promise";
import OpenAI from "openai";

const FRONT_URL = process.env.FRONT_URL;
const port = 8038;
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const employeeRoutes = (await import("./routes/debt/routes/employeeRoutes.js")).default;
const loanRoutes = (await import("./routes/debt/routes/loanRoutes.js")).default;
const paymentRoutes = (await import("./routes/debt/routes/paymentRoutes.js")).default;
const reportRoutes = (await import("./routes/debt/routes/reportRoutes.js")).default;
const walletRoutes = (await import("./routes/debt/routes/walletRoutes.js")).default;

// ✅ Configure CORS properly
const allowedOrigins = [
  `${FRONT_URL}`,
  "http://localhost:3000",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS policy: Access denied from this origin."));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Global error handler for CORS
app.use((err, req, res, next) => {
  if (err.message && err.message.includes("CORS")) {
    return res.status(403).json({ message: err.message });
  }
  next(err);
});

app.use(express.json());
app.use(bodyParser.json());
app.use(cookieParser());

// Middleware to serve static files (images)
const uploadsDirectory = path.join(__dirname, "uploads");
app.use("/uploads", express.static(uploadsDirectory));

// Routes
app.use("/users", userRout);
app.use("/orderItems", OrderItemRoute);
app.use("/stock/income", IncomeRoute);
app.use("/stock/outgoing", OutgoingRoute);
app.use("/stock/exist", ExistRoute);
app.use("/customers", CustomerRoute);
app.use("/remain", RemainRoute);
app.use("/expense", ExpenseRoute);
app.use("/staff", StaffRoute);
app.use("/attendance", AttendenceRoute);
app.use("/receipts", ReceiptRoute);
app.use("/owner", OwnerRoute);
app.use("/money", MoneyRoute);
app.use("/report", ReportRoute);
app.use("/companystock", CompanyStockRoute);
app.use("/palletmoney", PalletRoute);
app.use("/seller", SellerRoute);
app.use("/seller_accounts", SellerAccountRoute);
app.use("/pays", PayRoute);
app.use("/factors", FactorRouter);
app.use("/database", databaseRoute);

app.use("/employees", employeeRoutes);
app.use("/loans", loanRoutes);
app.use("/payments", paymentRoutes);
app.use("/reports", reportRoutes);
app.use("/wallets", walletRoutes);

// ============================================================
// 🤖 AI Chat Pipeline (replaces datalogue)
// ============================================================

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ⚠️ REPLACE these with the real table names from your database
const ALLOWED_TABLES = [
  "orderitems",
  "customers",
  "remain",
  "companystocks",
  "pallets",
];

// Read the schema of only the allowed tables
async function getSchema() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  try {
    const placeholders = ALLOWED_TABLES.map(() => "?").join(",");
    const [columns] = await connection.execute(
      `SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME IN (${placeholders})`,
      ALLOWED_TABLES
    );

    const grouped = {};
    for (const c of columns) {
      if (!grouped[c.TABLE_NAME]) grouped[c.TABLE_NAME] = [];
      grouped[c.TABLE_NAME].push(`${c.COLUMN_NAME} (${c.DATA_TYPE})`);
    }

    return Object.entries(grouped)
      .map(([table, cols]) => `Table ${table}:\n  ${cols.join("\n  ")}`)
      .join("\n\n");
  } finally {
    await connection.end();
  }
}

// Very lightweight SQL safety check
function isSafeSelect(sql) {
  const cleaned = sql.trim().toLowerCase();
  if (!cleaned.startsWith("select") && !cleaned.startsWith("with")) return false;
  const forbidden = ["insert", "update", "delete", "drop", "alter", "truncate", "create", "grant"];
  return !forbidden.some((word) => new RegExp(`\\b${word}\\b`, "i").test(cleaned));
}

app.post("/query", async (req, res) => {
  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ error: "Query is required" });
  }

  try {
    // 1. Get schema
    const schema = await getSchema();

    // 2. Ask OpenAI to generate SQL
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            "You are a MySQL expert. Convert the user's question into a single MySQL SELECT query " +
            "using ONLY the tables and columns listed below. " +
            "Return ONLY the raw SQL, no markdown, no explanation.\n\n" +
            "Schema:\n" +
            schema,
        },
        { role: "user", content: query },
      ],
    });

    let sql = completion.choices[0].message.content.trim();
    sql = sql.replace(/^```sql\s*/i, "").replace(/```$/i, "").trim();

    // 3. Safety validation
    if (!isSafeSelect(sql)) {
      return res.status(403).json({ error: "Only SELECT queries are allowed.", sql });
    }

    // 4. Execute
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    let rows;
    try {
      [rows] = await connection.execute(sql);
    } finally {
      await connection.end();
    }

    res.json({ sql, rows });
  } catch (error) {
    console.error("AI query error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Sync database and start server
// ============================================================
sequelize
  .sync({ alter: false })
  .then(() => {
    app.listen(port, () => {
      console.log(`✅ Server is running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("❌ Unable to connect to the database:", error);
  });