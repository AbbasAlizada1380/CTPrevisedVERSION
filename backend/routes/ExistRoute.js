import express from "express";
import {
  createExist,
  getAllExists,
  getExistById,
  getExistBySize,
  updateExist,
  updateQuantity,
  deleteExist,
  bulkCreateExists,
  getPaginatedExists,
} from "../Controllers/stock/ExistController.js";

const ExistRoute = express.Router();

// Create a new exist record
ExistRoute.post("/", createExist);

// Get all exist records
ExistRoute.get("/", getAllExists);

// Get paginated exist records
ExistRoute.get("/paginated", getPaginatedExists);

// Get single exist record by ID
ExistRoute.get("/:id", getExistById);

// Get exist record by size
ExistRoute.get("/size/:size", getExistBySize);

// Update exist record
ExistRoute.put("/:id", updateExist);

// Update quantity
ExistRoute.patch("/:id/quantity", updateQuantity);

// Delete exist record
ExistRoute.delete("/:id", deleteExist);

// Bulk create exist records
ExistRoute.post("/bulk", bulkCreateExists);

export default ExistRoute;