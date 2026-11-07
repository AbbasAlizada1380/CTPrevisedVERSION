import express from "express";
import {
  createCompanyStock,
  getCompanyStocks,
  getCompanyStockById,
  updateCompanyStock,
  deleteCompanyStock,
  getStockSummary,
  updateStockQuantity
} from "../Controllers/CompanyStock.js";

const CompanyStockRoute = express.Router();

// CREATE
CompanyStockRoute.post("/", createCompanyStock);

// READ (all with pagination & filtering)
CompanyStockRoute.get("/", getCompanyStocks);

// READ (single)
CompanyStockRoute.get("/:id", getCompanyStockById);

// UPDATE
CompanyStockRoute.put("/:id", updateCompanyStock);

// DELETE
CompanyStockRoute.delete("/:id", deleteCompanyStock);

// GET STOCK SUMMARY
CompanyStockRoute.get("/summary", getStockSummary);

// UPDATE STOCK QUANTITY (ADD/REMOVE)
CompanyStockRoute.patch("/:id/quantity", updateStockQuantity);

export default CompanyStockRoute;