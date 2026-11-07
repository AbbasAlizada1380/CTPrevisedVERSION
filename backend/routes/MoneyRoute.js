import express from "express";
import {
  createMoney,
  getMoneyList,
  getMoneyById,
  updateMoney,
  deleteMoney,
} from "../Controllers/MoneyController.js";

const MoneyRoute = express.Router();

MoneyRoute.post("/", createMoney);
MoneyRoute.get("/", getMoneyList);
MoneyRoute.get("/:id", getMoneyById);
MoneyRoute.put("/:id", updateMoney);
MoneyRoute.delete("/:id", deleteMoney);

export default MoneyRoute;
