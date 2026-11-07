import express from "express";
import {
  createOrderItem,
  getOrderItems,
  getOrderItemById,
  updateOrderItem,
  updateOrderItemProperties,
  deleteOrderItem,
  getCustomerOrdersByType,
  simpleSearchOrderItems,
  getOrderItemsByDateRange,
  getOrderItemsByCustomerAndDateRange,
  approveOrderItems,
  getOrderItemsBySizeAndMonth,
  getSizesList,
  getStockForecast,
} from "../Controllers/OrderItemsController.js";

const OrderItemRoute = express.Router();

/* ============================================================
   ✅ STATIC ROUTES FIRST — MUST be before /:id and /:customerId/:type
============================================================ */
OrderItemRoute.get("/search", simpleSearchOrderItems);
OrderItemRoute.get("/date_range", getOrderItemsByDateRange);
OrderItemRoute.get("/by-size-month", getOrderItemsBySizeAndMonth);
OrderItemRoute.get("/sizes", getSizesList);
OrderItemRoute.get("/forecast", getStockForecast);          // 👈 MOVED HERE
OrderItemRoute.get("/customer/:customerId/date_range", getOrderItemsByCustomerAndDateRange);

/* ============================================================
   ✅ WRITE ROUTES (static paths)
============================================================ */
OrderItemRoute.post("/approve", approveOrderItems);

/* ============================================================
   ✅ PARAM ROUTES LAST
============================================================ */
OrderItemRoute.get("/:customerId/:type", getCustomerOrdersByType);
OrderItemRoute.get("/:id", getOrderItemById);
OrderItemRoute.patch("/:id", updateOrderItemProperties);
OrderItemRoute.put("/:id", updateOrderItem);
OrderItemRoute.delete("/:id", deleteOrderItem);

/* ============================================================
   ✅ COLLECTION ROUTES
============================================================ */
OrderItemRoute.get("/", getOrderItems);
OrderItemRoute.post("/", createOrderItem);

export default OrderItemRoute;