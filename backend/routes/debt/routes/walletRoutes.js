import express from "express";
import {
  getWalletByEmployeeId,
  getAllWallets,
  resetWallet,
} from "../../../Controllers/debt/walletController.js";

const router = express.Router();

router.route("/").get(getAllWallets);

router.get("/employee/:employeeId", getWalletByEmployeeId);
router.put("/:id/reset", resetWallet);

export default router;
