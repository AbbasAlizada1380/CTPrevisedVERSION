import sequelize from "../../dbconnection.js";
import Factor from "../../Models/Finance/Factor.js";
import Seller from "../../Models/Seller/Seller.js";
import {Income} from "../../Models/index.js"
import { Op } from "sequelize";

/* ===============================
   GET ALL FACTORS (with seller, incomes list)
================================ */
export const getAllFactors = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await Factor.findAndCountAll({
      distinct: true, // count distinct factors, not joined rows
      include: [
        {
          model: Seller,
          as: "seller",
          attributes: ["id", "fullname", "phoneNumber"],
        },
        // optionally include the StockIncome items? income IDs are stored as JSON in `incomes`
        // we can add a separate endpoint for that or a virtual getter.
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      factors: rows,
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error in getAllFactors:", error);
    res.status(500).json({ success: false, message: "Failed to fetch factors", error: error.message });
  }
};

/* ===============================
   GET SINGLE FACTOR BY ID
================================ */
export const getFactorById = async (req, res) => {
  try {
    const { id } = req.params;
    const factor = await Factor.findByPk(id, {
      include: [
        {
          model: Seller,
          as: "seller",
          attributes: ["id", "fullname", "phoneNumber",],
        },
      ],
    });

    if (!factor) {
      return res.status(404).json({ success: false, message: "Factor not found" });
    }

    // Optionally fetch the actual StockIncome records from the incomes array
    let incomeDetails = [];
    if (factor.incomes && factor.incomes.length) {
      incomeDetails = await Income.findAll({
        where: { id: factor.incomes },
        include: [
          {
            model: StockExist,
            as: "stock",
            attributes: ["id", "name", "departmentId"],
          },
        ],
        order: [["createdAt", "ASC"]],
      });
    }

    res.json({
      success: true,
      factor,
      incomes: incomeDetails,
    });
  } catch (error) {
    console.error("Error in getFactorById:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

/* ===============================
   GET FACTORS BY DATE RANGE
================================ */
export const getFactorsByDateRange = async (req, res) => {
  const { from, to, sellerId } = req.query;
  if (!from || !to) {
    return res.status(400).json({ success: false, message: "from and to dates are required" });
  }

  try {
    const startDate = new Date(`${from}T00:00:00`);
    const endDate = new Date(`${to}T23:59:59`);

    const whereClause = {
      createdAt: { [Op.between]: [startDate, endDate] },
    };
    if (sellerId) {
      whereClause.sellerId = sellerId;
    }

    const factors = await Factor.findAll({
      where: whereClause,
      include: [
        {
          model: Seller,
          as: "seller",
          attributes: ["id", "fullname", "phoneNumber"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const totalAmount = factors.reduce((sum, f) => sum + parseFloat(f.totalAmount), 0);
    const totalPaid = factors.reduce((sum, f) => sum + parseFloat(f.paidAmount), 0);
    const totalRemaining = totalAmount - totalPaid;

    res.json({
      success: true,
      factors,
      summary: {
        totalFactors: factors.length,
        totalAmount,
        totalPaid,
        totalRemaining,
      },
      filters: { from, to, sellerId: sellerId || null },
    });
  } catch (error) {
    console.error("Error in getFactorsByDateRange:", error);
    res.status(500).json({ success: false, message: "Error fetching factors", error: error.message });
  }
};

/* ===============================
   GET FACTORS BY SELLER ID
================================ */
export const getFactorsBySeller = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const seller = await Seller.findByPk(sellerId);
    if (!seller) {
      return res.status(404).json({ success: false, message: "Seller not found" });
    }

    const factors = await Factor.findAll({
      where: { sellerId },
      include: [
        {
          model: Seller,
          as: "seller",
          attributes: ["id", "fullname", "phoneNumber"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const totalAmount = factors.reduce((sum, f) => sum + parseFloat(f.totalAmount), 0);
    const totalPaid = factors.reduce((sum, f) => sum + parseFloat(f.paidAmount), 0);

    res.json({
      success: true,
      seller: { id: seller.id, fullname: seller.fullname },
      factors,
      summary: {
        totalFactors: factors.length,
        totalAmount,
        totalPaid,
        outstandingBalance: totalAmount - totalPaid,
      },
    });
  } catch (error) {
    console.error("Error in getFactorsBySeller:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
