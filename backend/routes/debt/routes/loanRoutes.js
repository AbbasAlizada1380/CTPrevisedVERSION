import express from "express";
import {
  createLoan,
  getActiveLoans,
  getClosedLoans,
  getLoanById,
  closeLoan,
  getLoansByDateRange,          // 👈 Import the new controller
} from "../../../Controllers/debt/loanController.js";
import { validateLoan } from "../../../middleware/validation.js";

const router = express.Router();

// Public (or general) routes – placed before dynamic :id routes
router.route("/").post(validateLoan, createLoan);

router.get("/active", getActiveLoans);
router.get("/closed", getClosedLoans);
router.get("/date-range", getLoansByDateRange);   // 👈 New route for date-range filtering

// Dynamic routes (must come after specific ones)
router.route("/:id").get(getLoanById).put(closeLoan);

export default router;