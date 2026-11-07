import express from "express";
import {
  createOutgoing,
  getOutgoings,
  getOutgoingById,
  updateOutgoing,
  deleteOutgoing,
  getOutgoingsByDateRange, // 👈 NEW import
} from "../Controllers/stock/OutgoingController.js";

const OutgoingRoute = express.Router();

// Create new outgoing record (sell/remove from stock)
OutgoingRoute.post("/", createOutgoing);

// Get all outgoing records with pagination
OutgoingRoute.get("/", getOutgoings);

// 🆕 Get outgoing records by date range
// Example: GET /outgoing/date-range?from=2026-07-01&to=2026-07-12
OutgoingRoute.get("/date-range", getOutgoingsByDateRange);

// Get single outgoing record by ID
OutgoingRoute.get("/:id", getOutgoingById);

// Full update of outgoing record
OutgoingRoute.put("/:id", updateOutgoing);

// Delete outgoing record
OutgoingRoute.delete("/:id", deleteOutgoing);

export default OutgoingRoute;