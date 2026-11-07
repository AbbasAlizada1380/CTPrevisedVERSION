import Money from "../Models/Money.js";
import Owner from "../Models/owners.js";

/**
 * Create (take money) - with optional calculated flag
 */
export const createMoney = async (req, res) => {
  try {
    const { ownerId, amount, calculated } = req.body;

    if (!ownerId || amount === undefined) {
      return res.status(400).json({
        message: "ownerId and amount are required",
      });
    }

    if (Number(amount) < 0) {
      return res.status(400).json({
        message: "Amount cannot be negative",
      });
    }

    const owner = await Owner.findByPk(ownerId);
    if (!owner) {
      return res.status(404).json({
        message: "Owner not found",
      });
    }

    const moneyData = {
      ownerId,
      amount,
    };

    // Only add calculated if provided
    if (calculated !== undefined) {
      moneyData.calculated = Boolean(calculated);
    }

    const money = await Money.create(moneyData);

    res.status(201).json({
      message: "Money recorded successfully",
      money,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error creating money record",
      error: error.message,
    });
  }
};

/**
 * Get all money records with filtering options
 */
export const getMoneyList = async (req, res) => {
  try {
    const { calculated, ownerId } = req.query;
    const whereClause = {};

    // Apply filters if provided
    if (calculated !== undefined) {
      whereClause.calculated = calculated === 'true';
    }

    if (ownerId) {
      whereClause.ownerId = ownerId;
    }

    const moneyList = await Money.findAll({
      where: whereClause,
      include: [
        {
          model: Owner,
          as: "owner",
          attributes: ["id", "name"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      moneyList,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching money records",
      error: error.message,
    });
  }
};

/**
 * Get money by ID
 */
export const getMoneyById = async (req, res) => {
  try {
    const { id } = req.params;

    const money = await Money.findByPk(id, {
      include: [{
        model: Owner,
        as: "owner",
        attributes: ["id", "name"],
      }],
    });

    if (!money) {
      return res.status(404).json({
        message: "Money record not found",
      });
    }

    res.status(200).json({
      money,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching money",
      error: error.message,
    });
  }
};

/**
 * Update money amount and/or calculated flag
 */
export const updateMoney = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, calculated } = req.body;

    const money = await Money.findByPk(id);
    if (!money) {
      return res.status(404).json({
        message: "Money record not found",
      });
    }

    if (amount !== undefined) {
      if (Number(amount) < 0) {
        return res.status(400).json({
          message: "Amount cannot be negative",
        });
      }
      money.amount = amount;
    }

    if (calculated !== undefined) {
      money.calculated = Boolean(calculated);
    }

    await money.save();

    res.status(200).json({
      message: "Money updated successfully",
      money,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating money",
      error: error.message,
    });
  }
};

/**
 * Delete money record
 */
export const deleteMoney = async (req, res) => {
  try {
    const { id } = req.params;

    const money = await Money.findByPk(id);
    if (!money) {
      return res.status(404).json({
        message: "Money record not found",
      });
    }

    await money.destroy();

    res.status(200).json({
      message: "Money deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting money",
      error: error.message,
    });
  }
};

/**
 * Get summary statistics
 */
export const getMoneySummary = async (req, res) => {
  try {
    const { ownerId } = req.query;
    const whereClause = {};

    if (ownerId) {
      whereClause.ownerId = ownerId;
    }

    const totalAmount = await Money.sum('amount', { where: whereClause });
    const totalRecords = await Money.count({ where: whereClause });
    const calculatedRecords = await Money.count({ 
      where: { ...whereClause, calculated: true } 
    });
    const manualRecords = await Money.count({ 
      where: { ...whereClause, calculated: false } 
    });

    res.status(200).json({
      summary: {
        totalAmount: totalAmount || 0,
        totalRecords,
        calculatedRecords,
        manualRecords,
        averageAmount: totalRecords > 0 ? (totalAmount / totalRecords).toFixed(2) : 0
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching money summary",
      error: error.message,
    });
  }
};

/**
 * Bulk update calculated flag
 */
export const bulkUpdateCalculated = async (req, res) => {
  try {
    const { ids, calculated } = req.body;

    if (!Array.isArray(ids) || ids.length === 0 || calculated === undefined) {
      return res.status(400).json({
        message: "ids array and calculated flag are required",
      });
    }

    const [affectedCount] = await Money.update(
      { calculated: Boolean(calculated) },
      {
        where: {
          id: ids
        }
      }
    );

    res.status(200).json({
      message: `Successfully updated ${affectedCount} record(s)`,
      affectedCount,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error bulk updating records",
      error: error.message,
    });
  }
};

/**
 * Get money by owner ID
 */
export const getMoneyByOwner = async (req, res) => {
  try {
    const { ownerId } = req.params;

    const owner = await Owner.findByPk(ownerId);
    if (!owner) {
      return res.status(404).json({
        message: "Owner not found",
      });
    }

    const moneyRecords = await Money.findAll({
      where: { ownerId },
      order: [["createdAt", "DESC"]],
    });

    const totalAmount = moneyRecords.reduce((sum, record) => 
      sum + parseFloat(record.amount), 0
    );

    res.status(200).json({
      owner: {
        id: owner.id,
        name: owner.name,
      },
      transactions: moneyRecords,
      summary: {
        totalAmount,
        totalRecords: moneyRecords.length,
        calculatedTransactions: moneyRecords.filter(r => r.calculated).length,
        manualTransactions: moneyRecords.filter(r => !r.calculated).length,
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching owner's money records",
      error: error.message,
    });
  }
};