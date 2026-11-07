import express from "express";
import {
  createIncome,
  getIncomes,
  getIncomeById,
  updateIncome,
  updateIncomeProperties,
  deleteIncome,
  batchCreateIncomes,
  getIncomesByFactorId,
  getIncomesByDateRange, // 👈 NEW import
} from "../Controllers/stock/IncomeController.js";

const IncomeRoute = express.Router();

IncomeRoute.post("/batch", batchCreateIncomes);

// 🆕 Route to get incomes by date range
// Example: GET /api/income/date-range?from=2026-07-01&to=2026-07-12
IncomeRoute.get("/date-range", getIncomesByDateRange);

// 🆕 Route to get all incomes for a specific factor
IncomeRoute.get("/by-factor/:factorId", getIncomesByFactorId);

// Single income routes
IncomeRoute.patch("/:id", updateIncomeProperties);
IncomeRoute.post("/", createIncome);
IncomeRoute.get("/", getIncomes);
IncomeRoute.get("/:id", getIncomeById);
IncomeRoute.put("/:id", updateIncome);
IncomeRoute.delete("/:id", deleteIncome);

export default IncomeRoute;