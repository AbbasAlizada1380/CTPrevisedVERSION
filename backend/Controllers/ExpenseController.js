import Expense from "../Models/Expense.js";
import sequelize from "../dbconnection.js";
import { Op } from "sequelize";

/* ==============================
   Create a new Expense
================================ */
export const createExpense = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { purpose, by, amount, description } = req.body;

    if (!purpose || !by || amount === undefined) {
      return res.status(400).json({
        message: "Purpose, by, and amount are required",
      });
    }

    if (Number(amount) < 0) {
      return res.status(400).json({ message: "Amount must be >= 0" });
    }

    const expense = await Expense.create(
      { purpose, by, amount: Number(amount), description },
      { transaction }
    );

    await transaction.commit();

    res.status(201).json({
      message: "Expense created successfully",
      expense,
    });
  } catch (error) {
    await transaction.rollback();
    console.error(error);
    res.status(500).json({
      message: "Error creating expense",
      error: error.message,
    });
  }
};

/* ==============================
   Get all Expenses (with pagination)
================================ */
export const getExpenses = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await Expense.findAndCountAll({
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    res.json({
      expenses: rows,
      pagination: {
        total: count,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching expenses",
      error: error.message,
    });
  }
};

/* ==============================
   Get Expense by ID
================================ */
export const getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findByPk(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.json(expense);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching expense",
      error: error.message,
    });
  }
};

/* ==============================
   Update Expense
================================ */
export const updateExpense = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { purpose, by, amount, description } = req.body;

    const expense = await Expense.findByPk(req.params.id, { transaction });

    if (!expense) {
      await transaction.rollback();
      return res.status(404).json({ message: "Expense not found" });
    }

    if (amount !== undefined && Number(amount) < 0) {
      await transaction.rollback();
      return res.status(400).json({ message: "Amount must be >= 0" });
    }

    await expense.update(
      {
        purpose: purpose ?? expense.purpose,
        by: by ?? expense.by,
        amount: amount !== undefined ? Number(amount) : expense.amount,
        description: description ?? expense.description,
      },
      { transaction }
    );

    await transaction.commit();

    res.json({ message: "Expense updated successfully", expense });
  } catch (error) {
    await transaction.rollback();
    console.error(error);
    res.status(500).json({
      message: "Error updating expense",
      error: error.message,
    });
  }
};

/* ==============================
   Delete Expense
================================ */
export const deleteExpense = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const expense = await Expense.findByPk(req.params.id, { transaction });

    if (!expense) {
      await transaction.rollback();
      return res.status(404).json({ message: "Expense not found" });
    }

    await expense.destroy({ transaction });
    await transaction.commit();

    res.json({ message: "Expense deleted successfully" });
  } catch (error) {
    await transaction.rollback();
    console.error(error);
    res.status(500).json({
      message: "Error deleting expense",
      error: error.message,
    });
  }
};


/* ==============================
   Get Expenses by Date Range
================================ */
export const getExpensesByDateRange = async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({ message: "Both 'from' and 'to' dates are required" });
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999); // include the entire end date

    const expenses = await Expense.findAll({
      where: {
        createdAt: {
          [Op.between]: [fromDate, toDate], // <-- use Op here
        },
      },
      order: [["createdAt", "DESC"]],
    });

    res.json({
      expenses,
      totalCount: expenses.length,
      totalAmount: expenses.reduce((sum, e) => sum + Number(e.amount), 0),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching expenses by date range",
      error: error.message,
    });
  }
};
