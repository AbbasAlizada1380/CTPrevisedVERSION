import express from "express";
import {
  recordSellerPayment,   // renamed from createPay
  getAllPays,
  getSinglePay,
  updatePay,
  deletePay,
  getPaysByDateRange
} from "../../Controllers/Finance/PayController.js";

const PayRoute = express.Router();

PayRoute.post("/", recordSellerPayment);
PayRoute.get("/", getAllPays);
PayRoute.get("/date-range", getPaysByDateRange);
PayRoute.get("/:id", getSinglePay);
PayRoute.put("/:id", updatePay);
PayRoute.delete("/:id", deletePay);

export default PayRoute;