import express from "express";
import {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getExpensesByDateRange, // <-- import the new function
} from "../Controllers/ExpenseController.js";

const ExpenseRoute = express.Router();

// Create a new expense
ExpenseRoute.post("/", createExpense);

// Get all expenses (with optional pagination)
ExpenseRoute.get("/", getExpenses);

// Get expenses by date range
ExpenseRoute.get("/date_range", getExpensesByDateRange);

// Get a single expense by ID
ExpenseRoute.get("/:id", getExpenseById);

// Update an expense completely
ExpenseRoute.put("/:id", updateExpense);

// Delete an expense
ExpenseRoute.delete("/:id", deleteExpense);

export default ExpenseRoute;
