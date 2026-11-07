import express from "express";
import {
  createPalletMoney,
  getAllPalletMoney,
  getPalletMoneyById,
  updatePalletMoney,
  deletePalletMoney,
} from "../Controllers/PalletController.js";
const PalletRoute = express.Router();

/* ===========================
   Pallet Money Routes
=========================== */

PalletRoute.post("/create", createPalletMoney);
PalletRoute.get("/", getAllPalletMoney);
PalletRoute.get("/:id", getPalletMoneyById);
PalletRoute.put("/:id", updatePalletMoney);
PalletRoute.delete("/:id", deletePalletMoney);

export default PalletRoute;
