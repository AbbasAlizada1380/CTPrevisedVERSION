// routes/orderStats.js
import express from "express";
import {
  getOrderStatistics,
  getDetailedOrderStatistics,
} from "../Controllers/OrderStatesController.js";
const ReportRouter = express.Router();
// GET /api/order-stats
ReportRouter.get("/", getOrderStatistics);

// GET /api/order-stats/detailed
ReportRouter.get("/detailed", getDetailedOrderStatistics);

export default ReportRouter;
