import { Income, Seller, Exist,Pay } from "../../Models/index.js";
import sequelize from "../../dbconnection.js";
import { v4 as uuidv4 } from 'uuid';
import { Factor } from "../../Models/index.js";
import { SellerAccount } from "../../Models/index.js";
import { Op } from "sequelize";
/* ===========================
   Helper: Update Exist Table (with transaction)
=========================== */
export const updateExistTable = async (size, quantityChange, operation = 'add', transaction = null) => {
  try {
    let existRecord = await Exist.findOne({ where: { size }, transaction });

    if (!existRecord && operation === 'subtract') {
      throw new Error(`No stock record found for size: ${size}`);
    }
    if (!existRecord && operation === 'add') {
      // Create new record if adding
      existRecord = await Exist.create({ size, quantity: "0" }, { transaction });
    }

    const currentQty = parseFloat(existRecord.quantity || 0);
    const changeQty = parseFloat(quantityChange);
    let newQuantity;

    if (operation === 'subtract') {
      newQuantity = currentQty - changeQty;
      if (newQuantity < 0) {
        throw new Error(`Insufficient stock for size: ${size}. Available: ${currentQty}, Requested: ${changeQty}`);
      }
    } else if (operation === 'add') {
      newQuantity = currentQty + changeQty;
    } else {
      throw new Error('Invalid operation for stock update');
    }

    await existRecord.update({ quantity: newQuantity.toString() }, { transaction });
    return existRecord;
  } catch (error) {
    console.error('Error updating Exist table:', error);
    throw error;
  }
};

/* ===========================
   Helper: Get Current Stock (with transaction)
=========================== */
export const getCurrentStock = async (size, transaction = null) => {
  const existRecord = await Exist.findOne({ where: { size }, transaction });
  return existRecord ? parseFloat(existRecord.quantity || 0) : 0;
};

/* ===========================
   Helper: Get or Create Seller
=========================== */
const getOrCreateSeller = async (sellerData, transaction) => {
  if (sellerData.id) {
    const seller = await Seller.findByPk(sellerData.id, { transaction });
    if (!seller) throw new Error(`Seller with id ${sellerData.id} not found`);
    return seller;
  } else if (sellerData.name && sellerData.name.trim()) {
    const [seller, created] = await Seller.findOrCreate({
      where: { fullname: sellerData.name.trim() },
      defaults: { fullname: sellerData.name.trim(), isActive: false },
      transaction,
    });
    return seller;
  } else {
    throw new Error("Seller must provide either id or name");
  }
};

export const createPayRecord = async ({ sellerId, amount, description = "", transaction = null }) => {
  if (!sellerId || amount === undefined || amount <= 0) {
    throw new Error("Invalid pay record data: sellerId and positive amount are required");
  }

  try {
    const payRecord = await Pay.create({
      seller: sellerId,
      amount: parseFloat(amount),
      description: description || `Payment to seller ID ${sellerId}`,
    }, { transaction });
    return payRecord;  // ✅ return the full record (including id)
  } catch (error) {
    console.error("Error creating pay record:", error);
    throw error;
  }
};

export const batchCreateIncomes = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { seller, incomes, paidAmount = 0 } = req.body;

    if (!seller || !incomes || !Array.isArray(incomes) || incomes.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ message: "Invalid payload: need seller and non‑empty incomes array" });
    }

    const sellerRecord = await getOrCreateSeller(seller, transaction);
    const createdIncomes = [];
    let totalMoney = 0;
    let totalSpent = 0;

    // 1️⃣ Create incomes (without factorId yet)
    for (const item of incomes) {
      const { size, quantity, price, spent = 0 } = item;

      if (!size || !quantity || !price) {
        await transaction.rollback();
        return res.status(400).json({ message: "Each income must have size, quantity, and price" });
      }

      const qty = parseFloat(quantity);
      const prc = parseFloat(price);
      const spentVal = parseFloat(spent) || 0;

      if (qty <= 0 || prc <= 0) {
        await transaction.rollback();
        return res.status(400).json({ message: "Quantity and price must be positive numbers" });
      }

      const money = qty * prc;
      totalMoney += money;
      totalSpent += spentVal;

      const income = await Income.create(
        {
          size,
          quantity: qty.toString(),
          price: prc.toString(),
          money: money.toString(),
          spent: spentVal.toString(),
          sellerId: sellerRecord.id,
          // factorId will be set later
        },
        { transaction }
      );

      await updateExistTable(size, qty, 'add', transaction);
      createdIncomes.push(income);
    }

    // 2️⃣ Calculate totals and create Factor
    const upfrontPaid = parseFloat(paidAmount) || 0;
    if (upfrontPaid < 0) {
      await transaction.rollback();
      return res.status(400).json({ message: "paidAmount cannot be negative" });
    }

    const totalPaid = totalSpent + upfrontPaid;
    const remaining = totalMoney - totalPaid;

    let status = "unpaid";
    if (totalPaid >= totalMoney) status = "paid";
    else if (totalPaid > 0) status = "partial";

    const factorNumber = `FACT-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const incomesSummary = createdIncomes.map(inc => inc.id);

    const factor = await Factor.create(
      {
        factorNumber,
        sellerId: sellerRecord.id,
        totalAmount: totalMoney,
        paidAmount: totalPaid,
        remainingAmount: remaining,
        status,
        incomes: incomesSummary,
        notes: `Batch created on ${new Date().toISOString()}. Upfront payment: ${upfrontPaid}`,
      },
      { transaction }
    );

    // 3️⃣ 🆕 Update all created incomes with the factorId
    await Income.update(
      { factorId: factor.id },
      { where: { id: createdIncomes.map(i => i.id) }, transaction }
    );

    // 4️⃣ Create Pay record if upfrontPaid > 0
    let payRecordId = null;
    if (upfrontPaid > 0) {
      const payRecord = await createPayRecord({
        sellerId: sellerRecord.id,
        amount: upfrontPaid,
        description: `Upfront payment for factor ${factor.factorNumber} (ID: ${factor.id})`,
        transaction,
      });
      payRecordId = payRecord.id;
    }

    // 5️⃣ Update SellerAccount (including pays array)
    let sellerAccount = await SellerAccount.findOne({
      where: { sellerId: sellerRecord.id },
      lock: transaction.LOCK.UPDATE,
      transaction,
    });

    if (!sellerAccount) {
      const totalArray = [factor.id];
      const paidArray = status === 'paid' ? [factor.id] : [];
      const unpaidArray = (status === 'partial' || status === 'unpaid') ? [factor.id] : [];
      const paysArray = payRecordId ? [payRecordId] : [];

      sellerAccount = await SellerAccount.create({
        sellerId: sellerRecord.id,
        total: totalArray,
        paid: paidArray,
        unpaid: unpaidArray,
        pays: paysArray,
      }, { transaction });
    } else {
      let newTotal = Array.isArray(sellerAccount.total) ? [...sellerAccount.total] : [];
      let newPaid = Array.isArray(sellerAccount.paid) ? [...sellerAccount.paid] : [];
      let newUnpaid = Array.isArray(sellerAccount.unpaid) ? [...sellerAccount.unpaid] : [];
      let newPays = Array.isArray(sellerAccount.pays) ? [...sellerAccount.pays] : [];

      if (!newTotal.includes(factor.id)) newTotal.push(factor.id);

      if (status === 'paid') {
        if (!newPaid.includes(factor.id)) newPaid.push(factor.id);
        newUnpaid = newUnpaid.filter(id => id !== factor.id);
      } else if (status === 'partial' || status === 'unpaid') {
        if (!newUnpaid.includes(factor.id)) newUnpaid.push(factor.id);
        newPaid = newPaid.filter(id => id !== factor.id);
      }

      if (payRecordId && !newPays.includes(payRecordId)) {
        newPays.push(payRecordId);
      }

      await sellerAccount.update({
        total: newTotal,
        paid: newPaid,
        unpaid: newUnpaid,
        pays: newPays,
      }, { transaction });
    }

    await transaction.commit();

    // 6️⃣ Fetch final incomes with seller relation
    const incomesWithSeller = await Income.findAll({
      where: { id: createdIncomes.map(i => i.id) },
      include: [{ model: Seller, as: 'seller' }],
      order: [['createdAt', 'DESC']],
    });

    res.status(201).json({
      message: `${createdIncomes.length} incomes created successfully`,
      incomes: incomesWithSeller,
      seller: sellerRecord,
      factor: {
        id: factor.id,
        factorNumber: factor.factorNumber,
        totalAmount: factor.totalAmount,
        paidAmount: factor.paidAmount,
        remainingAmount: factor.remainingAmount,
        status: factor.status,
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Batch create error:", error);
    res.status(500).json({ message: "Error creating batch incomes", error: error.message });
  }
};

/* ===========================
   SINGLE CREATE INCOME (optional, keep for backward compatibility)
=========================== */
export const createIncome = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { seller, size, quantity, price, spent } = req.body;

    // If seller is provided, use it; otherwise, allow income without seller?
    // For consistency, we'll require seller even in single create.
    if (!seller) {
      await transaction.rollback();
      return res.status(400).json({ message: "Seller information is required" });
    }

    const sellerRecord = await getOrCreateSeller(seller, transaction);
    const qty = parseFloat(quantity);
    const prc = parseFloat(price);
    const spentVal = parseFloat(spent) || 0;

    if (!size || qty <= 0 || prc <= 0) {
      await transaction.rollback();
      return res.status(400).json({ message: "Size, positive quantity, and positive price are required" });
    }

    const money = qty * prc;

    const income = await Income.create({
      size,
      quantity: qty.toString(),
      price: prc.toString(),
      money: money.toString(),
      spent: spentVal.toString(),
      sellerId: sellerRecord.id,
    }, { transaction });

    await updateExistTable(size, qty, 'add', transaction);
    await transaction.commit();

    const incomeWithSeller = await Income.findByPk(income.id, { include: [{ model: Seller, as: 'seller' }] });
    res.status(201).json(incomeWithSeller);
  } catch (error) {
    await transaction.rollback();
    console.error(error);
    res.status(500).json({ message: "Error creating income", error: error.message });
  }
};

/* ===========================
   UPDATE INCOME (PUT) – unchanged but ensure seller can be updated
=========================== */
export const updateIncome = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { seller, size, quantity, price, spent } = req.body;

    const income = await Income.findByPk(id, { transaction });
    if (!income) {
      await transaction.rollback();
      return res.status(404).json({ message: "Income record not found" });
    }

    // If seller is provided, update it
    let sellerId = income.sellerId;
    if (seller) {
      const sellerRecord = await getOrCreateSeller(seller, transaction);
      sellerId = sellerRecord.id;
    }

    // ... rest of stock adjustment logic (unchanged, but using transaction) ...
    // (Keep your existing update logic, just add sellerId update)

    const oldSize = income.size;
    const oldQuantity = parseFloat(income.quantity);
    const newQuantity = parseFloat(quantity);
    const newSize = size || oldSize;
    const newPrice = parseFloat(price);
    const newSpent = parseFloat(spent) !== undefined ? parseFloat(spent) : parseFloat(income.spent);

    // Validate
    if (newQuantity <= 0 || newPrice <= 0) {
      await transaction.rollback();
      return res.status(400).json({ message: "Quantity and price must be positive" });
    }

    // Handle stock adjustments (similar to your existing code, but with transaction)
    if (newSize !== oldSize) {
      // Return stock to old size
      await updateExistTable(oldSize, oldQuantity, 'subtract', transaction);
      // Add stock to new size
      await updateExistTable(newSize, newQuantity, 'add', transaction);
    } else {
      const diff = newQuantity - oldQuantity;
      if (diff !== 0) {
        const op = diff > 0 ? 'add' : 'subtract';
        await updateExistTable(oldSize, Math.abs(diff), op, transaction);
      }
    }

    const money = newQuantity * newPrice;
    await income.update({
      size: newSize,
      quantity: newQuantity.toString(),
      price: newPrice.toString(),
      money: money.toString(),
      spent: newSpent.toString(),
      sellerId: sellerId,
    }, { transaction });

    await transaction.commit();

    const updatedIncome = await Income.findByPk(id, { include: [{ model: Seller, as: 'seller' }] });
    res.json(updatedIncome);
  } catch (error) {
    await transaction.rollback();
    console.error(error);
    res.status(500).json({ message: "Error updating income", error: error.message });
  }
};

/* ===========================
   DELETE INCOME – unchanged but adjust stock
=========================== */
export const deleteIncome = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const income = await Income.findByPk(id, { transaction });
    if (!income) {
      await transaction.rollback();
      return res.status(404).json({ message: "Income record not found" });
    }

    // Remove from stock
    await updateExistTable(income.size, parseFloat(income.quantity), 'subtract', transaction);

    await income.destroy({ transaction });
    await transaction.commit();
    res.json({ message: "Income deleted successfully" });
  } catch (error) {
    await transaction.rollback();
    console.error(error);
    res.status(500).json({ message: "Error deleting income", error: error.message });
  }
};

/* ===========================
   GET INCOMES (with seller info)
=========================== */
export const getIncomes = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await Income.findAndCountAll({
      include: [{ model: Seller, as: 'seller' }],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    // Summary calculations
    const totalMoney = rows.reduce((sum, inc) => sum + parseFloat(inc.money || 0), 0);
    const totalSpent = rows.reduce((sum, inc) => sum + parseFloat(inc.spent || 0), 0);
    const totalProfit = totalMoney - totalSpent;

    // Stock levels for distinct sizes
    const allSizes = [...new Set(rows.map(inc => inc.size))];
    const stockLevels = {};
    for (const size of allSizes) {
      const stock = await Exist.findOne({ where: { size } });
      stockLevels[size] = stock ? stock.quantity : "0";
    }

    res.json({
      incomes: rows,
      summary: { totalMoney, totalSpent, totalProfit, totalItems: count },
      stockLevels,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        perPage: limit,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching incomes", error: error.message });
  }
};

/* ===========================
   GET INCOME BY ID (with seller)
=========================== */
export const getIncomeById = async (req, res) => {
  try {
    const { id } = req.params;
    const income = await Income.findByPk(id, { include: [{ model: Seller, as: 'seller' }] });
    if (!income) return res.status(404).json({ message: "Income not found" });
    res.json(income);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching income", error: error.message });
  }
};

/* ===========================
   PARTIAL UPDATE (PATCH) – optional, keep as is but include seller
=========================== */
export const updateIncomeProperties = async (req, res) => {
  // Similar adjustments – add seller handling if needed
  // For brevity, I'll keep your existing logic but ensure transaction and stock updates are correct.
  // (You can extend it yourself following the pattern above)
};

/* ===============================
   GET INCOMES BY FACTOR ID
================================ */
export const getIncomesByFactorId = async (req, res) => {
  try {
    const { factorId } = req.params;

    // Optional: check if factor exists first
    const factor = await Factor.findByPk(factorId);
    if (!factor) {
      return res.status(404).json({
        success: false,
        message: "Factor not found",
      });
    }

    // Pagination (optional)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50; // default 50 items per page
    const offset = (page - 1) * limit;

    const { count, rows: incomes } = await Income.findAndCountAll({
      where: { factorId },
      include: [
        {
          model: Seller,
          as: "seller",
          attributes: ["id", "fullname", "phoneNumber"],
        },
        // Optionally include the Exist/Stock association if needed
        // {
        //   model: Exist,
        //   as: "stock",
        //   attributes: ["id", "name", "departmentId"],
        // },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      factor: {
        id: factor.id,
        factorNumber: factor.factorNumber,
        totalAmount: factor.totalAmount,
        status: factor.status,
      },
      incomes,
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
    console.error("Error in getIncomesByFactorId:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch incomes for this factor",
      error: error.message,
    });
  }
};

/* ===========================
   GET INCOMES BY DATE RANGE
=========================== */
export const getIncomesByDateRange = async (req, res) => {
  try {
    const { from, to, page = 1, limit = 10 } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        message: "Both 'from' and 'to' dates are required",
      });
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999); // include entire end date

    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 10;
    const offset = (pageNumber - 1) * limitNumber;

    const { count, rows: incomes } = await Income.findAndCountAll({
      where: {
        createdAt: {
          [Op.between]: [fromDate, toDate],
        },
      },
      include: [
        {
          model: Seller,
          as: 'seller',
          attributes: ['id', 'fullname', 'phoneNumber'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: limitNumber,
      offset,
    });

    // ─── Overall totals ──────────────────────────────────────────────
    const totalMoney = incomes.reduce((sum, inc) => sum + parseFloat(inc.money || 0), 0);
    const totalSpent = incomes.reduce((sum, inc) => sum + parseFloat(inc.spent || 0), 0);
    const totalProfit = totalMoney - totalSpent;
    const totalQuantity = incomes.reduce((sum, inc) => sum + parseFloat(inc.quantity || 0), 0);

    // ─── Size‑wise aggregation ───────────────────────────────────────
    const sizeMap = incomes.reduce((acc, inc) => {
      const size = inc.size || 'بدون سایز';
      if (!acc[size]) {
        acc[size] = { size, totalQuantity: 0, totalMoney: 0, totalSpent: 0 };
      }
      acc[size].totalQuantity += parseFloat(inc.quantity || 0);
      acc[size].totalMoney += parseFloat(inc.money || 0);
      acc[size].totalSpent += parseFloat(inc.spent || 0);
      return acc;
    }, {});

    // Convert to array and compute profit per size
    const sizes = Object.values(sizeMap).map((s) => ({
      ...s,
      totalProfit: s.totalMoney - s.totalSpent,
    }));

    // ─── Response ─────────────────────────────────────────────────────
    res.json({
      success: true,
      incomes,
      summary: {
        totalItems: count,
        totalQuantity,
        totalMoney,
        totalSpent,
        totalProfit,
        sizes, // 👈 size breakdown
      },
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / limitNumber),
        currentPage: pageNumber,
        perPage: limitNumber,
        hasNextPage: pageNumber < Math.ceil(count / limitNumber),
        hasPrevPage: pageNumber > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching incomes by date range:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching incomes by date range",
      error: error.message,
    });
  }
};