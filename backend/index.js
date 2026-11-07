import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import userRout from "./routes/userRout.js";
import sequelize from "./dbconnection.js";
import path, { dirname, join } from "path";
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
const FRONT_URL = process.env.FRONT_URL
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
  `${FRONT_URL}`, // React local dev
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
    credentials: true, // allow cookies and auth headers
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

// Sync database and start server
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
