import express from "express";
import {
  createRemain,
  getRemains,
  getRemainById,
  updateRemain,
  addOrderIdsToRemain,
  removeOrderIdsFromRemain,
  deleteRemain,
  getRemainOrderItemsByCustomer,
  getRemainingMoneyOfAllCustomers,
} from "../Controllers/RemainController.js";

const RemainRoute = express.Router();

// add / remove orderIds
RemainRoute.patch("/:id/add-orders", addOrderIdsToRemain);
RemainRoute.patch("/:id/remove-orders", removeOrderIdsFromRemain);

// CRUD
RemainRoute.post("/", createRemain);
RemainRoute.get("/", getRemains);
RemainRoute.get("/customer", getRemainingMoneyOfAllCustomers);
RemainRoute.get("/:id", getRemainById);
RemainRoute.put("/:id", updateRemain);
RemainRoute.delete("/:id", deleteRemain);
RemainRoute.get("/:customerId/orders", getRemainOrderItemsByCustomer);


export default RemainRoute;
