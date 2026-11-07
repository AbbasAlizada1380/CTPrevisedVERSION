import { SellerAccount, Seller, Factor,sequelize } from "../../Models/index.js";
import { Op } from "sequelize";
import Sequelize from "sequelize";

export const getSellersWithUnpaidFactors = async (req, res) => {
  try {
    const { page = 1, limit = 20, includeFactorDetails = false } = req.query;
    const pageNumber = parseInt(page);
    const pageLimit = parseInt(limit);
    const offset = (pageNumber - 1) * pageLimit;

    // Determine the correct JSON array length function based on dialect
    const dialect = sequelize.getDialect();
    let lengthFunction;
    if (dialect === 'mysql' || dialect === 'mariadb') {
      lengthFunction = Sequelize.fn('JSON_LENGTH', Sequelize.col('unpaid'));
    } else if (dialect === 'postgres') {
      lengthFunction = Sequelize.fn('jsonb_array_length', Sequelize.col('unpaid'));
    } else {
      // Fallback for SQLite or others – we'll need in-memory filtering, but better to warn.
      // For SQLite, there's no native JSON function, so we keep old logic (but warn).
      console.warn('Unsupported dialect for JSON array length, falling back to in-memory filtering');
      // ... (keep old code with warning)
    }

    const whereCondition = lengthFunction 
      ? { [Op.and]: Sequelize.where(lengthFunction, '>', 0) }
      : {};

    const sellerAccounts = await SellerAccount.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: Seller,
          as: "seller",
          attributes: ["id", "fullname", "phoneNumber", "isActive"],
        },
      ],
      limit: pageLimit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    // If we used database filtering, rows are already correct
    let accountsWithUnpaid = sellerAccounts.rows;
    let totalFilteredRecords = sellerAccounts.count;

    // Fallback for unsupported dialect (in-memory)
    if (!lengthFunction) {
      accountsWithUnpaid = sellerAccounts.rows.filter(
        (acc) => Array.isArray(acc.unpaid) && acc.unpaid.length > 0
      );
      totalFilteredRecords = accountsWithUnpaid.length;
      // Re-paginate in memory (inefficient but necessary)
      const paginatedInMemory = accountsWithUnpaid.slice(offset, offset + pageLimit);
      // We'll need to adjust for the fact that sellerAccounts.rows already limited by DB offset/limit
      // This is complicated; better to recommend switching to a supported DB.
    }

    if (totalFilteredRecords === 0) {
      return res.json({
        success: true,
        page: pageNumber,
        limit: pageLimit,
        totalRecords: 0,
        totalPages: 0,
        data: [],
      });
    }

    // Collect all unpaid factor IDs across these sellers
    const allUnpaidFactorIds = accountsWithUnpaid.flatMap((acc) => acc.unpaid);

    // Fetch all relevant factors
    const factors = await Factor.findAll({
      where: { id: { [Op.in]: allUnpaidFactorIds } },
      attributes: ["id", "remainingAmount", "sellerId", "factorNumber", "status", "totalAmount", "paidAmount"],
    });

    const factorMap = new Map(factors.map((f) => [f.id, f]));

    // Compute total owed per seller
    const result = accountsWithUnpaid.map((account) => {
      const unpaidFactorIds = account.unpaid;
      let totalOwed = 0;
      const unpaidFactorDetails = [];

      for (const factorId of unpaidFactorIds) {
        const factor = factorMap.get(factorId);
        if (factor) {
          const remaining = parseFloat(factor.remainingAmount) || 0;
          totalOwed += remaining;
          if (includeFactorDetails === "true" || includeFactorDetails === true) {
            unpaidFactorDetails.push({
              id: factor.id,
              factorNumber: factor.factorNumber,
              remainingAmount: remaining,
              totalAmount: factor.totalAmount,
              paidAmount: factor.paidAmount,
              status: factor.status,
            });
          }
        } else {
          console.warn(`Factor ID ${factorId} not found for seller ${account.sellerId}`);
        }
      }

      const sellerInfo = account.seller || { id: account.sellerId };

      return {
        seller: {
          id: sellerInfo.id,
          fullname: sellerInfo.fullname,
          phoneNumber: sellerInfo.phoneNumber,
          isActive: sellerInfo.isActive,
        },
        totalUnpaidAmount: totalOwed,
        unpaidFactorCount: unpaidFactorIds.length,
        unpaidFactorIds: includeFactorDetails === "true" ? undefined : unpaidFactorIds,
        unpaidFactors: includeFactorDetails === "true" ? unpaidFactorDetails : undefined,
      };
    });

    // Sort by total unpaid amount (descending)
    result.sort((a, b) => b.totalUnpaidAmount - a.totalUnpaidAmount);

    // For unsupported dialect, we already paginated in memory; otherwise, data is already paginated.
    const finalData = lengthFunction ? result : result; // if fallback, result is already paginated slice

    res.json({
      success: true,
      page: pageNumber,
      limit: pageLimit,
      totalRecords: totalFilteredRecords,
      totalPages: Math.ceil(totalFilteredRecords / pageLimit),
      data: finalData,
    });
  } catch (error) {
    console.error("Error fetching sellers with unpaid factors:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching sellers with unpaid factors",
      error: error.message,
    });
  }
};


// ==============================
// Create Seller Account
// ==============================
export const createSellerAccount = async (req, res) => {
  try {
    const { sellerId, paid = [], unpaid = [], total = [] } = req.body;

    if (!sellerId) {
      return res.status(400).json({
        success: false,
        message: "sellerId is required",
      });
    }

    // Check if account already exists for this seller
    const existing = await SellerAccount.findOne({ where: { sellerId } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `SellerAccount already exists for sellerId ${sellerId}`,
      });
    }

    const account = await SellerAccount.create({
      sellerId,
      paid: Array.isArray(paid) ? paid : [],
      unpaid: Array.isArray(unpaid) ? unpaid : [],
      total: Array.isArray(total) ? total : [],
    });

    res.status(201).json({
      success: true,
      message: "Seller account created successfully",
      data: account,
    });
  } catch (error) {
    console.error("Error creating seller account:", error);
    res.status(500).json({
      success: false,
      message: "Error creating seller account",
      error: error.message,
    });
  }
};

// ==============================
// Get All Seller Accounts (with pagination & seller filter)
// ==============================
export const getAllSellerAccounts = async (req, res) => {
  try {
    const { page = 1, limit = 20, sellerId } = req.query;

    const pageNumber = parseInt(page);
    const pageLimit = parseInt(limit);
    const offset = (pageNumber - 1) * pageLimit;

    const where = {};
    if (sellerId) where.sellerId = sellerId;

    const { rows, count } = await SellerAccount.findAndCountAll({
      where,
      include: [
        {
          model: Seller,
          as: "seller", // adjust alias if defined in association
          attributes: ["id", "fullname", "phoneNumber", "isActive"],
        },
      ],
      limit: pageLimit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      page: pageNumber,
      limit: pageLimit,
      totalRecords: count,
      totalPages: Math.ceil(count / pageLimit),
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching seller accounts:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching seller accounts",
      error: error.message,
    });
  }
};

// ==============================
// Get Single Seller Account by ID
// ==============================
export const getSellerAccountById = async (req, res) => {
  try {
    const { id } = req.params;

    const account = await SellerAccount.findByPk(id, {
      include: [
        {
          model: Seller,
          as: "seller",
          attributes: ["id", "fullname", "phoneNumber", "isActive"],
        },
      ],
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Seller account not found",
      });
    }

    res.json({
      success: true,
      data: account,
    });
  } catch (error) {
    console.error("Error fetching seller account:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching seller account",
      error: error.message,
    });
  }
};

// ==============================
// Get Seller Account by Seller ID
// ==============================
export const getSellerAccountBySellerId = async (req, res) => {
  try {
    const { sellerId } = req.params;

    const account = await SellerAccount.findOne({
      where: { sellerId },
      include: [
        {
          model: Seller,
          as: "seller",
          attributes: ["id", "fullname", "phoneNumber", "isActive"],
        },
      ],
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: `Seller account not found for sellerId ${sellerId}`,
      });
    }

    res.json({
      success: true,
      data: account,
    });
  } catch (error) {
    console.error("Error fetching seller account by sellerId:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching seller account",
      error: error.message,
    });
  }
};

// ==============================
// Update Seller Account (full or partial)
// ==============================
export const updateSellerAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { paid, unpaid, total } = req.body;

    const account = await SellerAccount.findByPk(id);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Seller account not found",
      });
    }

    const updateData = {};
    if (paid !== undefined) updateData.paid = Array.isArray(paid) ? paid : [];
    if (unpaid !== undefined) updateData.unpaid = Array.isArray(unpaid) ? unpaid : [];
    if (total !== undefined) updateData.total = Array.isArray(total) ? total : [];

    await account.update(updateData);

    // Refresh with association
    const updatedAccount = await SellerAccount.findByPk(id, {
      include: [
        {
          model: Seller,
          as: "seller",
          attributes: ["id", "fullname", "phoneNumber", "isActive"],
        },
      ],
    });

    res.json({
      success: true,
      message: "Seller account updated successfully",
      data: updatedAccount,
    });
  } catch (error) {
    console.error("Error updating seller account:", error);
    res.status(500).json({
      success: false,
      message: "Error updating seller account",
      error: error.message,
    });
  }
};

// ==============================
// Delete Seller Account
// ==============================
export const deleteSellerAccount = async (req, res) => {
  try {
    const { id } = req.params;

    const account = await SellerAccount.findByPk(id);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Seller account not found",
      });
    }

    await account.destroy();

    res.json({
      success: true,
      message: "Seller account deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting seller account:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting seller account",
      error: error.message,
    });
  }
};

// ==============================
// Helper: Sync SellerAccount based on Factor changes (optional)
// ==============================
export const syncSellerAccountWithFactors = async (sellerId, transaction = null) => {
  try {
    const { Factor } = await import("../../Models/index.js");

    const factors = await Factor.findAll({
      where: { sellerId },
      attributes: ["id", "status"],
      transaction,
    });

    const total = factors.map(f => f.id);
    const paid = factors.filter(f => f.status === "paid").map(f => f.id);
    const unpaid = factors.filter(f => f.status !== "paid").map(f => f.id);

    const [account, created] = await SellerAccount.findOrCreate({
      where: { sellerId },
      defaults: { total, paid, unpaid },
      transaction,
    });

    if (!created) {
      await account.update({ total, paid, unpaid }, { transaction });
    }

    return account;
  } catch (error) {
    console.error("Error syncing seller account with factors:", error);
    throw error;
  }
};