import express from "express";
import {
  makePayment,
  getLoanPayments,
  getPaymentById,
  updatePayment,
  deletePayment,
  getPaymentsByDateRange,   // ✅ import the new controller
} from "../../../Controllers/debt/paymentController.js";
import { validatePayment } from "../../../middleware/validation.js";

const router = express.Router();

// GET /api/payments?from=...&to=...  → filter by date range (or all)
router.get("/", getPaymentsByDateRange);

router.route("/").post(validatePayment, makePayment);

router.get("/loan/:loanId", getLoanPayments);

router
  .route("/:id")
  .get(getPaymentById)
  .put(validatePayment, updatePayment)
  .delete(deletePayment);

export default router;