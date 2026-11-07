import Outgoing from "../../Models/Stock/outgoing.js";
import {Income} from "../../Models/index.js";
import Exist from "../../Models/Stock/exist.js";
import CompanyStock from "../../Models/CompanyStock.js"; // Import CompanyStock model
import sequelize from "../../dbconnection.js";
import { Op } from "sequelize";

/* ===========================
   Helper Function: Calculate Average Price from Income
=========================== */
const calculateAveragePrice = async (size) => {
  try {
    // Get all income records for this size
    const incomes = await Income.findAll({
      where: { size },
      attributes: ['id', 'quantity', 'price', 'money', 'spent'],
      order: [['createdAt', 'ASC']] // Oldest first for FIFO
    });

    if (incomes.length === 0) {
      throw new Error(`No income records found for size: ${size}. Cannot calculate price.`);
    }

    // Calculate weighted average price
    let totalQuantity = 0;
    let totalValue = 0;
    let totalRemaining = 0;

    incomes.forEach(income => {
      const qty = parseFloat(income.quantity) || 0;
      const price = parseFloat(income.price) || 0;
      const spent = parseFloat(income.spent || 0);
      const remaining = qty - spent;

      totalQuantity += qty;
      totalValue += qty * price;
      totalRemaining += remaining;
    });

    if (totalQuantity === 0) {
      throw new Error(`Total quantity is zero for size: ${size}`);
    }

    const averagePrice = totalValue / totalQuantity;
    return {
      averagePrice: averagePrice.toFixed(3),
      totalQuantity,
      totalValue: totalValue.toFixed(3),
      totalRemaining,
      incomes // Return incomes for FIFO processing
    };
  } catch (error) {
    console.error('Error calculating average price:', error);
    throw error;
  }
};

/* ===========================
   Helper Function: Allocate Quantity from Income (FIFO)
=========================== */
const allocateQuantityFromIncome = async (size, outgoingQuantity) => {
  try {
    // Get income records for this size, ordered by oldest first (FIFO)
    const incomes = await Income.findAll({
      where: {
        size,
        // Get records that still have unsold stock (spent < quantity)
        [Op.and]: [
          sequelize.where(
            sequelize.cast(sequelize.col('spent'), 'DECIMAL'),
            { [Op.lt]: sequelize.cast(sequelize.col('quantity'), 'DECIMAL') }
          )
        ]
      },
      order: [['createdAt', 'ASC']], // FIFO: oldest first
      attributes: ['id', 'quantity', 'price', 'money', 'spent']
    });

    if (incomes.length === 0) {
      // Check if any income records exist at all
      const anyIncome = await Income.findOne({ where: { size } });
      if (!anyIncome) {
        throw new Error(`No income records found for size: ${size}`);
      }
      throw new Error(`No available stock in income records for size: ${size}. All stock has been sold.`);
    }

    let remainingQty = parseFloat(outgoingQuantity);
    let totalCost = 0;
    let totalRevenue = 0; // New: Calculate total revenue based on actual prices
    const allocations = [];

    // Process income records using FIFO
    for (const income of incomes) {
      if (remainingQty <= 0) break;

      const incomeQty = parseFloat(income.quantity);
      const incomePrice = parseFloat(income.price);
      const incomeSpent = parseFloat(income.spent || 0);

      // Calculate available quantity in this income record
      const availableQty = incomeQty - incomeSpent;

      if (availableQty <= 0) continue; // This record is already fully spent

      // Determine how much to take from this record
      const takeQty = Math.min(remainingQty, availableQty);
      const takeCost = takeQty * incomePrice;
      const takeRevenue = takeQty * incomePrice; // Revenue at this specific price

      allocations.push({
        incomeId: income.id,
        takeQty,
        takeCost,
        takeRevenue, // Store revenue for this allocation
        newSpent: incomeSpent + takeQty,
        availableQtyBefore: availableQty,
        price: incomePrice
      });

      totalCost += takeCost;
      totalRevenue += takeRevenue; // Accumulate total revenue
      remainingQty -= takeQty;
    }

    if (remainingQty > 0) {
      // Calculate total available stock
      let totalAvailable = 0;
      incomes.forEach(income => {
        const qty = parseFloat(income.quantity);
        const spent = parseFloat(income.spent || 0);
        totalAvailable += qty - spent;
      });

      throw new Error(`Insufficient available stock in income records. Needed: ${outgoingQuantity}, Available: ${totalAvailable}`);
    }

    return {
      totalCost: totalCost.toFixed(3),
      totalRevenue: totalRevenue.toFixed(3), // Return total revenue
      allocations,
      outgoingQuantity,
      size,
      totalAllocated: outgoingQuantity - remainingQty
    };
  } catch (error) {
    console.error('Error allocating quantity from income:', error);
    throw error;
  }
};

/* ===========================
   Helper Function: Update Income Spent Quantities
=========================== */
const updateIncomeSpentAmounts = async (allocations, transaction) => {
  try {
    const updates = [];

    for (const allocation of allocations) {
      const { incomeId, takeQty, newSpent } = allocation;

      // Update spent quantity
      const [affectedRows] = await Income.update(
        { spent: newSpent.toString() },
        {
          where: { id: incomeId },
          transaction,
        }
      );

      updates.push({
        incomeId,
        updated: affectedRows > 0,
        takeQty,
        newSpent,
      });
    }

    return updates;
  } catch (error) {
    console.error("Error updating income spent quantities:", error);
    throw error;
  }
};

/* ===========================
   Helper Function: Update Exist Table (Subtract stock)
=========================== */
const updateExistTable = async (size, quantity, operation = 'subtract', transaction = null) => {
  try {
    // Find existing record for this size
    let existRecord = await Exist.findOne({
      where: { size },
      transaction
    });

    if (!existRecord) {
      throw new Error(`No stock record found for size: ${size}`);
    }

    // Update existing record
    const currentQty = parseFloat(existRecord.quantity || 0);
    const changeQty = parseFloat(quantity);

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

    await existRecord.update({
      quantity: newQuantity.toString()
    }, { transaction });

    return {
      existRecord,
      previousQuantity: currentQty,
      newQuantity
    };
  } catch (error) {
    console.error('Error updating Exist table:', error);
    throw error;
  }
};

/* ===========================
   Helper Function: Update or Create CompanyStock Record
=========================== */
const updateCompanyStock = async (size, quantity, money, operation = 'subtract', transaction = null) => {
  try {
    // Find existing CompanyStock record for this size
    let companyStockRecord = await CompanyStock.findOne({
      where: { size },
      transaction
    });

    if (!companyStockRecord) {
      // Create new record if it doesn't exist
      companyStockRecord = await CompanyStock.create({
        size,
        quantity: '0',
        money: '0'
      }, { transaction });
    }

    // Update CompanyStock record
    const currentQty = parseFloat(companyStockRecord.quantity || 0);
    const currentMoney = parseFloat(companyStockRecord.money || 0);
    const changeQty = parseFloat(quantity);
    const changeMoney = parseFloat(money || 0);

    let newQuantity;
    let newMoney;

    if (operation === 'subtract') {
      newQuantity = currentQty - changeQty;
      newMoney = currentMoney - changeMoney;
      if (newQuantity < 0) {
        throw new Error(`Insufficient company stock for size: ${size}. Available: ${currentQty}, Requested: ${changeQty}`);
      }
    } else if (operation === 'add') {
      newQuantity = currentQty + changeQty;
      newMoney = currentMoney + changeMoney;
    } else {
      throw new Error('Invalid operation for company stock update');
    }

    await companyStockRecord.update({
      quantity: newQuantity.toString(),
      money: newMoney.toString()
    }, { transaction });

    return {
      companyStockRecord,
      previousQuantity: currentQty,
      previousMoney: currentMoney,
      newQuantity,
      newMoney
    };
  } catch (error) {
    console.error('Error updating CompanyStock table:', error);
    throw error;
  }
};

/* ===========================
   Helper Function: Get Current Stock
=========================== */
const getCurrentStock = async (size, transaction = null) => {
  const existRecord = await Exist.findOne({
    where: { size },
    transaction
  });
  return existRecord ? parseFloat(existRecord.quantity || 0) : 0;
};

/* ===========================
   Create Outgoing (Sell/Remove from stock)
=========================== */
export const createOutgoing = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { size, quantity } = req.body;

    if (!size || !quantity) {
      await transaction.rollback();
      return res.status(400).json({
        message: "Size and quantity are required fields",
      });
    }

    const requestedQty = parseFloat(quantity);
    if (requestedQty <= 0) {
      await transaction.rollback();
      return res.status(400).json({
        message: "Quantity must be greater than 0",
      });
    }
    // Check if sufficient stock exists in Exist table
    const currentStock = await getCurrentStock(size, transaction);
    if (requestedQty > currentStock) {
      await transaction.rollback();
      return res.status(400).json({
        message: `Insufficient stock for size: ${size}. Available: ${currentStock}, Requested: ${requestedQty}`,
      });
    }

    // Allocate quantity from Income records using FIFO
    const allocation = await allocateQuantityFromIncome(size, quantity);

    // Get average price for information (not for calculation)
    const priceInfo = await calculateAveragePrice(size);
    const averagePrice = parseFloat(priceInfo.averagePrice);

    // Calculate total revenue based on actual prices from allocation
    const totalRevenue = parseFloat(allocation.totalRevenue); // This is now based on actual prices

    // Calculate profit (revenue minus cost - note: cost and revenue use same prices)
    const profit = totalRevenue - parseFloat(allocation.totalCost);

    // Create outgoing record with calculated money based on actual prices
    const outgoing = await Outgoing.create({
      size,
      quantity: quantity.toString(),
      money: totalRevenue.toFixed(3).toString(), // Use actual calculated revenue
    }, { transaction });

    // Update Income spent quantities
    const incomeUpdates = await updateIncomeSpentAmounts(allocation.allocations, transaction);

    // Update Exist table (subtract stock)
    const stockUpdate = await updateExistTable(size, quantity, 'subtract', transaction);

    // Update CompanyStock table (add the sold stock)
    const companyStockUpdate = await updateCompanyStock(
      size,
      quantity,
      totalRevenue.toFixed(3), // 💰 correct money
      'add',
      transaction
    );


    await transaction.commit();

    const responseData = {
      ...outgoing.toJSON(),
      pricing: {
        averageSellingPrice: averagePrice.toFixed(3), // For information only
        actualTotalRevenue: totalRevenue.toFixed(3), // Based on actual prices
        totalCost: allocation.totalCost,
        profit: profit.toFixed(3),
        profitMargin: totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(2) + '%' : '0%',
        note: "Revenue calculated using actual prices from each income record"
      },
      stockUpdate: {
        size: stockUpdate.existRecord.size,
        previousQuantity: stockUpdate.previousQuantity,
        newQuantity: stockUpdate.newQuantity,
        quantitySubtracted: quantity
      },
      companyStockUpdate: {
        size: companyStockUpdate.companyStockRecord.size,
        previousQuantity: companyStockUpdate.previousQuantity,
        previousMoney: companyStockUpdate.previousMoney,
        newQuantity: companyStockUpdate.newQuantity,
        newMoney: companyStockUpdate.newMoney,
        quantityAdded: quantity,
        moneyAdded: totalRevenue.toFixed(3)
      },
      costAllocation: {
        method: 'FIFO (First-In, First-Out)',
        allocations: allocation.allocations.map(a => ({
          incomeId: a.incomeId,
          quantityTaken: a.takeQty,
          pricePerUnit: a.price,
          revenueFromThisAllocation: (a.takeQty * a.price).toFixed(3),
          costFromThisAllocation: (a.takeQty * a.price).toFixed(3), // Same as revenue since we use purchase price
          newSpentQuantity: a.newSpent
        })),
        totalItemsAllocated: allocation.allocations.length,
        totalQuantityAllocated: allocation.totalAllocated
      }
    };

    res.status(201).json(responseData);
  } catch (error) {
    await transaction.rollback();
    console.error(error);

    if (error.message.includes('No income records found') ||
      error.message.includes('No stock record found') ||
      error.message.includes('Insufficient stock') ||
      error.message.includes('No available stock') ||
      error.message.includes('Insufficient available stock')) {
      return res.status(400).json({
        message: error.message,
      });
    }

    res.status(500).json({
      message: "Error creating outgoing record",
      error: error.message,
    });
  }
};

/* ===========================
   Get Outgoings (Paginated)
=========================== */
export const getOutgoings = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await Outgoing.findAndCountAll({
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    // Calculate totals
    const totalQuantity = rows.reduce((sum, outgoing) => {
      return sum + parseFloat(outgoing.quantity || 0);
    }, 0);

    const totalMoney = rows.reduce((sum, outgoing) => {
      return sum + parseFloat(outgoing.money || 0);
    }, 0);

    // Get current stock levels for all sizes
    const allSizes = [...new Set(rows.map(outgoing => outgoing.size))];
    const stockLevels = {};
    const companyStockLevels = {};

    for (const size of allSizes) {
      const stock = await Exist.findOne({ where: { size } });
      stockLevels[size] = stock ? stock.quantity : "0";

      const companyStock = await CompanyStock.findOne({ where: { size } });
      companyStockLevels[size] = companyStock ? {
        quantity: companyStock.quantity,
        money: companyStock.money
      } : { quantity: "0", money: "0" };
    }

    res.json({
      outgoings: rows,
      summary: {
        totalQuantity,
        totalMoney,
        totalItems: count,
        averageSaleValue: count > 0 ? (totalMoney / count).toFixed(3) : 0
      },
      stockLevels,
      companyStockLevels,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        perPage: limit,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching outgoing records",
      error: error.message,
    });
  }
};

/* ===========================
   Get Outgoing by ID
=========================== */
export const getOutgoingById = async (req, res) => {
  try {
    const { id } = req.params;

    const outgoing = await Outgoing.findByPk(id);
    if (!outgoing) {
      return res.status(404).json({ message: "Outgoing record not found" });
    }

    // Get price info for this size
    let priceInfo = {};
    try {
      priceInfo = await calculateAveragePrice(outgoing.size);
    } catch (error) {
      priceInfo = { error: error.message };
    }

    // Calculate allocation for this outgoing
    let allocationInfo = {};
    try {
      allocationInfo = await allocateQuantityFromIncome(outgoing.size, outgoing.quantity);
    } catch (error) {
      allocationInfo = { error: error.message };
    }

    // Get current stock for this size
    const currentStock = await getCurrentStock(outgoing.size);

    // Get company stock for this size
    const companyStockRecord = await CompanyStock.findOne({ where: { size: outgoing.size } });
    const companyStock = companyStockRecord ? {
      quantity: companyStockRecord.quantity,
      money: companyStockRecord.money
    } : { quantity: "0", money: "0" };

    // Calculate profit
    const revenue = parseFloat(outgoing.money);
    const cost = parseFloat(allocationInfo.totalCost || 0);
    const profit = revenue - cost;

    const responseData = {
      ...outgoing.toJSON(),
      priceInfo,
      allocationInfo,
      profitAnalysis: {
        revenue: revenue.toFixed(3),
        cost: cost.toFixed(3),
        profit: profit.toFixed(3),
        profitMargin: revenue > 0 ? ((profit / revenue) * 100).toFixed(2) + '%' : '0%'
      },
      currentStock: currentStock.toString(),
      companyStock: companyStock,
      unitPrice: (parseFloat(outgoing.money) / parseFloat(outgoing.quantity)).toFixed(3)
    };

    res.json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching outgoing record",
      error: error.message,
    });
  }
};

/* ===========================
   Update Outgoing (PUT - Full Update)
=========================== */
export const updateOutgoing = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { size, quantity } = req.body;

    const outgoing = await Outgoing.findByPk(id, { transaction });
    if (!outgoing) {
      await transaction.rollback();
      return res.status(404).json({ message: "Outgoing record not found" });
    }

    if (!size || !quantity) {
      await transaction.rollback();
      return res.status(400).json({
        message: "Size and quantity are required for full update",
      });
    }

    const oldSize = outgoing.size;
    const oldQuantity = parseFloat(outgoing.quantity);
    const oldMoney = parseFloat(outgoing.money);
    const newQuantity = parseFloat(quantity);

    if (newQuantity <= 0) {
      await transaction.rollback();
      return res.status(400).json({ message: "Quantity must be greater than 0" });
    }

    // Handle stock adjustments
    if (size !== oldSize) {
      // Return stock to old size (add back what was subtracted)
      const oldExist = await Exist.findOne({ where: { size: oldSize }, transaction });
      if (oldExist) {
        const currentOldQty = parseFloat(oldExist.quantity);
        await oldExist.update({
          quantity: (currentOldQty + oldQuantity).toString()
        }, { transaction });
      }

      // Return to old CompanyStock
      const oldCompanyStock = await CompanyStock.findOne({ where: { size: oldSize }, transaction });
      if (oldCompanyStock) {
        const currentOldQty = parseFloat(oldCompanyStock.quantity);
        const currentOldMoney = parseFloat(oldCompanyStock.money);
        await oldCompanyStock.update({
          quantity: (currentOldQty - oldQuantity).toString(),
          money: (currentOldMoney - oldMoney).toString()
        }, { transaction });
      }

      // Check stock availability for new size
      const newExist = await Exist.findOne({ where: { size }, transaction });
      if (!newExist || parseFloat(newExist.quantity || 0) < newQuantity) {
        await transaction.rollback();
        return res.status(400).json({
          message: `Insufficient stock for new size: ${size}`,
        });
      }

      // Subtract from new size
      const currentNewQty = parseFloat(newExist.quantity);
      await newExist.update({
        quantity: (currentNewQty - newQuantity).toString()
      }, { transaction });
    }
    else if (newQuantity !== oldQuantity) {
      const existRecord = await Exist.findOne({ where: { size } });
      if (!existRecord) {
        await transaction.rollback();
        return res.status(400).json({ message: `No stock record found for size: ${size}` });
      }

      const currentStock = parseFloat(existRecord.quantity);
      const quantityDifference = newQuantity - oldQuantity;

      // If increasing quantity, check stock availability
      if (quantityDifference > 0) {
        if (quantityDifference > currentStock) {
          await transaction.rollback();
          return res.status(400).json({
            message: `Insufficient stock. Available: ${currentStock}, Additional needed: ${quantityDifference}`,
          });
        }
      }

      const newStock = currentStock - quantityDifference;
      await existRecord.update({
        quantity: newStock.toString()
      }, { transaction });

      // Update CompanyStock for quantity change
      const companyStockRecord = await CompanyStock.findOne({ where: { size }, transaction });
      if (companyStockRecord) {
        const currentQty = parseFloat(companyStockRecord.quantity);
        const currentMoney = parseFloat(companyStockRecord.money);

        // First, remove the old quantity and money
        const adjustedQty = currentQty - oldQuantity;
        const adjustedMoney = currentMoney - oldMoney;

        // Then wait for new money calculation
        await companyStockRecord.update({
          quantity: adjustedQty.toString(),
          money: adjustedMoney.toString()
        }, { transaction });
      }
    }

    // Allocate quantity from Income records for new quantity
    const allocation = await allocateQuantityFromIncome(size, newQuantity);

    // Update Income spent quantities for new allocation
    const incomeUpdates = await updateIncomeSpentAmounts(allocation.allocations, transaction);

    // Calculate new money based on actual prices from allocation
    const newMoney = parseFloat(allocation.totalRevenue);

    // Calculate profit
    const profit = newMoney - parseFloat(allocation.totalCost);

    // Update outgoing record
    await outgoing.update({
      size,
      quantity: quantity.toString(),
      money: newMoney.toFixed(3).toString(),
    }, { transaction });

    // Update CompanyStock with new values
    const companyStockRecord = await CompanyStock.findOne({ where: { size }, transaction });
    if (companyStockRecord) {
      const currentQty = parseFloat(companyStockRecord.quantity);
      const currentMoney = parseFloat(companyStockRecord.money);

      // Add the new quantity and money
      await companyStockRecord.update({
        quantity: (currentQty + newQuantity).toString(),
        money: (currentMoney + newMoney).toString()
      }, { transaction });
    } else {
      // Create new CompanyStock record if it doesn't exist
      await CompanyStock.create({
        size,
        quantity: newQuantity.toString(),
        money: newMoney.toFixed(3).toString()
      }, { transaction });
    }

    await transaction.commit();

    const updatedOutgoing = await Outgoing.findByPk(id);

    const responseData = {
      ...updatedOutgoing.toJSON(),
      pricing: {
        totalRevenue: newMoney.toFixed(3),
        totalCost: allocation.totalCost,
        profit: profit.toFixed(3)
      },
      costAllocation: {
        allocations: allocation.allocations.map(a => ({
          incomeId: a.incomeId,
          quantityTaken: a.takeQty,
          pricePerUnit: a.price,
          revenueFromThisAllocation: (a.takeQty * a.price).toFixed(3)
        })),
        totalItemsAllocated: allocation.allocations.length
      }
    };

    res.json(responseData);
  } catch (error) {
    await transaction.rollback();
    console.error(error);
    res.status(500).json({
      message: "Error updating outgoing record",
      error: error.message,
    });
  }
};

/* ===========================
   Delete Outgoing
=========================== */
export const deleteOutgoing = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;

    const outgoing = await Outgoing.findByPk(id, { transaction });
    if (!outgoing) {
      await transaction.rollback();
      return res.status(404).json({ message: "Outgoing record not found" });
    }

    const outgoingSize = outgoing.size;
    const outgoingQuantity = parseFloat(outgoing.quantity);
    const outgoingMoney = parseFloat(outgoing.money);

    // Note: Reversing spent quantities from income records is complex
    // For simplicity, we'll just return stock but not reverse spent amounts

    // Return stock to Exist table
    const existRecord = await Exist.findOne({
      where: { size: outgoingSize },
      transaction
    });

    if (existRecord) {
      const currentQty = parseFloat(existRecord.quantity);
      await existRecord.update({
        quantity: (currentQty + outgoingQuantity).toString()
      }, { transaction });
    } else {
      // Create new record if doesn't exist
      await Exist.create({
        size: outgoingSize,
        quantity: outgoingQuantity.toString()
      }, { transaction });
    }

    // Remove from CompanyStock table
    const companyStockRecord = await CompanyStock.findOne({
      where: { size: outgoingSize },
      transaction
    });

    if (companyStockRecord) {
      const currentQty = parseFloat(companyStockRecord.quantity);
      const currentMoney = parseFloat(companyStockRecord.money);

      await companyStockRecord.update({
        quantity: (currentQty - outgoingQuantity).toString(),
        money: (currentMoney - outgoingMoney).toString()
      }, { transaction });
    }

    // Delete outgoing record
    await outgoing.destroy({ transaction });

    await transaction.commit();

    res.json({
      message: "Outgoing record deleted successfully",
      note: `Stock returned: ${outgoing.quantity} units of size ${outgoing.size}. Note: Spent quantities in income records were not reversed.`
    });
  } catch (error) {
    await transaction.rollback();
    console.error(error);
    res.status(500).json({
      message: "Error deleting outgoing record",
      error: error.message,
    });
  }
};

/* ===========================
   Partial Update (PATCH)
=========================== */
export const updateOutgoingProperties = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const updateData = req.body;

    const outgoing = await Outgoing.findByPk(id, { transaction });
    if (!outgoing) {
      await transaction.rollback();
      return res.status(404).json({ message: "Outgoing record not found" });
    }

    const oldSize = outgoing.size;
    const oldQuantity = parseFloat(outgoing.quantity);
    const oldMoney = parseFloat(outgoing.money);

    // Handle stock adjustments if size or quantity is being updated
    if (updateData.size || updateData.quantity) {
      const newSize = updateData.size || oldSize;
      const newQuantity = updateData.quantity ? parseFloat(updateData.quantity) : oldQuantity;

      if (newQuantity <= 0) {
        await transaction.rollback();
        return res.status(400).json({ message: "Quantity must be greater than 0" });
      }

      // If size changed
      if (newSize !== oldSize) {
        // Return stock to old size in Exist table
        const oldExist = await Exist.findOne({ where: { size: oldSize }, transaction });
        if (oldExist) {
          const currentOldQty = parseFloat(oldExist.quantity);
          await oldExist.update({
            quantity: (currentOldQty + oldQuantity).toString()
          }, { transaction });
        }

        // Return to old CompanyStock
        const oldCompanyStock = await CompanyStock.findOne({ where: { size: oldSize }, transaction });
        if (oldCompanyStock) {
          const currentOldQty = parseFloat(oldCompanyStock.quantity);
          const currentOldMoney = parseFloat(oldCompanyStock.money);
          await oldCompanyStock.update({
            quantity: (currentOldQty - oldQuantity).toString(),
            money: (currentOldMoney - oldMoney).toString()
          }, { transaction });
        }

        // Check stock availability for new size
        const newExist = await Exist.findOne({ where: { size: newSize }, transaction });
        if (!newExist || parseFloat(newExist.quantity || 0) < newQuantity) {
          await transaction.rollback();
          return res.status(400).json({
            message: `Insufficient stock for new size: ${newSize}`,
          });
        }

        // Subtract from new size in Exist table
        const currentNewQty = parseFloat(newExist.quantity);
        await newExist.update({
          quantity: (currentNewQty - newQuantity).toString()
        }, { transaction });
      }
      // If same size but quantity changed
      else if (newQuantity !== oldQuantity) {
        const existRecord = await Exist.findOne({ where: { size: oldSize }, transaction });
        if (!existRecord) {
          await transaction.rollback();
          return res.status(400).json({ message: `No stock record found for size: ${oldSize}` });
        }

        const currentStock = parseFloat(existRecord.quantity);
        const quantityDifference = newQuantity - oldQuantity;

        if (quantityDifference > 0 && quantityDifference > currentStock) {
          await transaction.rollback();
          return res.status(400).json({
            message: `Insufficient stock. Available: ${currentStock}, Additional needed: ${quantityDifference}`,
          });
        }

        const newStock = currentStock - quantityDifference;
        await existRecord.update({
          quantity: newStock.toString()
        }, { transaction });

        // Update CompanyStock for quantity change
        const companyStockRecord = await CompanyStock.findOne({ where: { size: oldSize }, transaction });
        if (companyStockRecord) {
          const currentQty = parseFloat(companyStockRecord.quantity);
          const currentMoney = parseFloat(companyStockRecord.money);

          // First, remove the old quantity and money
          const adjustedQty = currentQty - oldQuantity;
          const adjustedMoney = currentMoney - oldMoney;

          await companyStockRecord.update({
            quantity: adjustedQty.toString(),
            money: adjustedMoney.toString()
          }, { transaction });
        }
      }
    }

    // Allocate quantity from Income records if quantity changed
    let newMoney = oldMoney;
    if (updateData.quantity && parseFloat(updateData.quantity) !== oldQuantity) {
      const size = updateData.size || outgoing.size;
      const quantity = updateData.quantity;
      const allocation = await allocateQuantityFromIncome(size, quantity);
      await updateIncomeSpentAmounts(allocation.allocations, transaction);

      // Recalculate money based on actual prices
      newMoney = parseFloat(allocation.totalRevenue);
      updateData.money = newMoney.toFixed(3).toString();
    }

    // Update outgoing record
    await outgoing.update(updateData, { transaction });

    // Update CompanyStock with final values
    const finalSize = updateData.size || oldSize;
    const finalQuantity = updateData.quantity ? parseFloat(updateData.quantity) : oldQuantity;

    const companyStockRecord = await CompanyStock.findOne({ where: { size: finalSize }, transaction });
    if (companyStockRecord) {
      const currentQty = parseFloat(companyStockRecord.quantity);
      const currentMoney = parseFloat(companyStockRecord.money);

      // Add the final quantity and money
      await companyStockRecord.update({
        quantity: (currentQty + finalQuantity).toString(),
        money: (currentMoney + newMoney).toString()
      }, { transaction });
    } else {
      // Create new CompanyStock record if it doesn't exist
      await CompanyStock.create({
        size: finalSize,
        quantity: finalQuantity.toString(),
        money: newMoney.toFixed(3).toString()
      }, { transaction });
    }

    await transaction.commit();

    const updatedOutgoing = await Outgoing.findByPk(id);
    res.json(updatedOutgoing);
  } catch (error) {
    await transaction.rollback();
    console.error(error);
    res.status(500).json({
      message: "Error updating outgoing record",
      error: error.message,
    });
  }
};


/* ===========================
   Get Outgoings by Date Range
=========================== */
export const getOutgoingsByDateRange = async (req, res) => {
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
    toDate.setHours(23, 59, 59, 999);

    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 10;
    const offset = (pageNumber - 1) * limitNumber;

    const { count, rows: outgoings } = await Outgoing.findAndCountAll({
      where: {
        createdAt: {
          [Op.between]: [fromDate, toDate],
        },
      },
      order: [["createdAt", "DESC"]],
      limit: limitNumber,
      offset,
    });

    // ─── Overall totals ──────────────────────────────────────────────
    const totalQuantity = outgoings.reduce((sum, o) => sum + parseFloat(o.quantity || 0), 0);
    const totalMoney = outgoings.reduce((sum, o) => sum + parseFloat(o.money || 0), 0);

    // ─── Size breakdown ──────────────────────────────────────────────
    const sizeMap = outgoings.reduce((acc, o) => {
      const size = o.size || "بدون سایز";
      if (!acc[size]) {
        acc[size] = { size, totalQuantity: 0, totalMoney: 0 };
      }
      acc[size].totalQuantity += parseFloat(o.quantity || 0);
      acc[size].totalMoney += parseFloat(o.money || 0);
      return acc;
    }, {});

    const sizes = Object.values(sizeMap).map((s) => ({
      ...s,
      totalProfit: s.totalMoney, // Revenue (cost not calculated here)
    }));
    sizes.sort((a, b) => a.size.localeCompare(b.size));

    res.json({
      success: true,
      outgoings,
      summary: {
        totalItems: count,
        totalQuantity,
        totalMoney,
        sizes,
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
    console.error("Error fetching outgoings by date range:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching outgoings by date range",
      error: error.message,
    });
  }
};