// routes/customerRoutes.js
import express from "express";
import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  updateCustomerProperties,
  deleteCustomer,
  searchCustomers,
  getActiveCustomers,
} from "../Controllers/CustomersController.js";

const CustomerRoute = express.Router();

CustomerRoute.patch("/:id", updateCustomerProperties);
CustomerRoute.get("/active", getActiveCustomers);
CustomerRoute.get("/search", searchCustomers);
CustomerRoute.post("/", createCustomer);
CustomerRoute.get("/", getCustomers);
CustomerRoute.get("/:id", getCustomerById);
CustomerRoute.put("/:id", updateCustomer);
CustomerRoute.delete("/:id", deleteCustomer);

export default CustomerRoute;
