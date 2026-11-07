import express from "express";
import {
  getCompanySummary,
  getEmployeeLoanHistory,
  getPaymentsReport,
  getLoansReport,
  getDashboardStats,
} from "../../../Controllers/debt/reportController.js";

const router = express.Router();

router.get("/summary", getCompanySummary);
router.get("/dashboard", getDashboardStats);
router.get("/employee/:employeeId/loans", getEmployeeLoanHistory);
router.get("/payments", getPaymentsReport);
router.get("/loans", getLoansReport);

export default router;
