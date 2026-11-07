import { Pay, SellerAccount, Seller, Factor } from "../../Models/index.js";
import { Op } from "sequelize";
import sequelize from "../../dbconnection.js";


export const recordSellerPayment = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { sellerId, amount, description = "" } = req.body;

    if (!sellerId || !amount || amount <= 0) {
      await transaction.rollback();
      return res.status(400).json({ message: "Invalid request: sellerId and positive amount are required" });
    }

    // 1. Get seller account with unpaid factor IDs
    const sellerAccount = await SellerAccount.findOne({
      where: { sellerId },
      transaction,
    });

    if (!sellerAccount) {
      await transaction.rollback();
      return res.status(404).json({ message: `Seller account not found for sellerId ${sellerId}` });
    }

    let unpaidFactorIds = sellerAccount.unpaid || [];
    if (!Array.isArray(unpaidFactorIds) || unpaidFactorIds.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ message: "This seller has no unpaid factors to pay" });
    }

    // 2. Fetch unpaid factors, ordered by creation date (oldest first – FIFO)
    const unpaidFactors = await Factor.findAll({
      where: { id: unpaidFactorIds },
      order: [["createdAt", "ASC"]],
      transaction,
    });

    if (unpaidFactors.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ message: "No unpaid factors found (IDs may be invalid)" });
    }

    let remainingAmount = parseFloat(amount);
    const fullyPaidFactorIds = [];
    const partiallyPaidFactors = [];

    // 3. Allocate payment to factors
    for (const factor of unpaidFactors) {
      if (remainingAmount <= 0) break;

      const currentRemaining = parseFloat(factor.remainingAmount);
      if (currentRemaining <= 0) continue;

      if (remainingAmount >= currentRemaining) {
        // Fully pay this factor
        remainingAmount -= currentRemaining;
        factor.paidAmount = factor.totalAmount;
        factor.remainingAmount = 0;
        factor.status = "paid";
        fullyPaidFactorIds.push(factor.id);
        await factor.save({ transaction });
      } else {
        // Partial payment on this factor
        const newPaidAmount = parseFloat(factor.paidAmount) + remainingAmount;
        const newRemaining = currentRemaining - remainingAmount;
        factor.paidAmount = newPaidAmount;
        factor.remainingAmount = newRemaining;
        factor.status = "partial";
        await factor.save({ transaction });
        partiallyPaidFactors.push(factor.id);
        remainingAmount = 0;
        break;
      }
    }

    // Overpayment check
    if (remainingAmount > 0) {
      await transaction.rollback();
      const totalUnpaid = unpaidFactors.reduce((sum, f) => sum + parseFloat(f.remainingAmount), 0);
      return res.status(400).json({
        message: `Payment amount exceeds total unpaid balance. Unpaid total: ${totalUnpaid}`,
      });
    }

    // 4. Update SellerAccount arrays (paid, unpaid)
    let newUnpaid = [...unpaidFactorIds];
    let newPaid = sellerAccount.paid ? [...sellerAccount.paid] : [];

    newUnpaid = newUnpaid.filter((id) => !fullyPaidFactorIds.includes(id));

    for (const id of fullyPaidFactorIds) {
      if (!newPaid.includes(id)) newPaid.push(id);
    }

    // 5. Create Pay record
    const payRecord = await Pay.create(
      {
        seller: sellerId,
        amount: parseFloat(amount),
        description: description || `Payment received for factors: ${fullyPaidFactorIds.join(", ")}${partiallyPaidFactors.length ? ` (partial for ${partiallyPaidFactors.join(", ")})` : ""}`,
      },
      { transaction }
    );

    // 6. Update SellerAccount's pays array (append the new pay record ID)
    let currentPays = sellerAccount.pays ? [...sellerAccount.pays] : [];
    currentPays.push(payRecord.id);
    
    await sellerAccount.update(
      {
        unpaid: newUnpaid,
        paid: newPaid,
        pays: currentPays,
      },
      { transaction }
    );

    await transaction.commit();

    res.status(201).json({
      message: "Payment recorded successfully",
      payment: {
        id: payRecord.id,
        sellerId,
        amount: parseFloat(amount),
        description: payRecord.description,
        createdAt: payRecord.createdAt,
      },
      updatedFactors: {
        fullyPaid: fullyPaidFactorIds,
        partiallyPaid: partiallyPaidFactors,
      },
      sellerAccount: {
        unpaid: newUnpaid,
        paid: newPaid,
        pays: currentPays,
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error recording seller payment:", error);
    res.status(500).json({ message: "Error recording payment", error: error.message });
  }
};

// ==============================
// Get All Pays (Pagination)
// ==============================
export const getAllPays = async (req, res) => {
  try {
    const { page = 1, limit = 20, seller } = req.query;

    const pageNumber = parseInt(page);
    const pageLimit = parseInt(limit);
    const offset = (pageNumber - 1) * pageLimit;

    const where = {};
    if (seller) where.seller = seller;

    const { rows, count } = await Pay.findAndCountAll({
      where,
      include: [
        {
          model: Seller,
          as: "sellerInfo",
          attributes: ["id", "fullname", "phoneNumber"],
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
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error fetching payments",
      error: error.message,
    });
  }
};

// ==============================
// Get Single Pay
// ==============================
export const getSinglePay = async (req, res) => {
  try {
    const { id } = req.params;

    const pay = await Pay.findByPk(id, {
      include: [
        {
          model: Seller,
          as: "sellerInfo",
          attributes: ["id", "fullname", "phoneNumber"],
        },
      ],
    });

    if (!pay) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    res.json({
      success: true,
      data: pay,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error fetching payment",
      error: error.message,
    });
  }
};

// ==============================
// Update Pay
// ==============================
export const updatePay = async (req, res) => {
  try {
    const { id } = req.params;
    const { seller, amount, description } = req.body;

    const pay = await Pay.findByPk(id);

    if (!pay) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    await pay.update({
      seller,
      amount,
      description,
    });

    res.json({
      success: true,
      message: "Payment updated successfully",
      data: pay,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error updating payment",
      error: error.message,
    });
  }
};

// ==============================
// Delete Pay
// ==============================
export const deletePay = async (req, res) => {
  try {
    const { id } = req.params;

    const pay = await Pay.findByPk(id);

    if (!pay) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    await pay.destroy();

    res.json({
      success: true,
      message: "Payment deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error deleting payment",
      error: error.message,
    });
  }
};

// ==============================
// Get Pays by Date Range (with optional seller filter)
// ==============================
export const getPaysByDateRange = async (req, res) => {
  const { from, to, sellerId } = req.query;

  if (!from || !to) {
    return res.status(400).json({
      success: false,
      message: "from and to dates are required",
    });
  }

  try {
    const startDate = new Date(`${from}T00:00:00`);
    const endDate = new Date(`${to}T23:59:59`);

    const whereClause = {
      createdAt: {
        [Op.between]: [startDate, endDate],
      },
    };

    if (sellerId) {
      whereClause.seller = sellerId;
    }

    const pays = await Pay.findAll({
      where: whereClause,
      include: [
        {
          model: Seller,
          as: "sellerInfo",
          attributes: ["id", "fullname", "phoneNumber"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const totalAmount = pays.reduce(
      (sum, p) => sum + parseFloat(p.amount || 0),
      0
    );

    return res.status(200).json({
      success: true,
      message: "Pays fetched successfully",
      data: {
        pays,
        totalCount: pays.length,
        totalAmount,
        filters: {
          from,
          to,
          sellerId: sellerId || null,
        },
      },
    });
  } catch (error) {
    console.error("Error in getPaysByDateRange:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching pays",
      error: error.message,
    });
  }
};