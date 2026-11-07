import OrderItem from "../Models/OrderItems.js";
import Customer from "../Models/Customers.js";
import { Op } from "sequelize";
import Receipt from "../Models/Receipt.js";
import sequelize from "../dbconnection.js";
import Remain from "../Models/Remain.js";

/* =====================================================
   CREATE RECEIPT (Distribute payment to unpaid orders)
===================================================== */
export const createReceipt = async (req, res) => {
  const { customer, amount, calculated, description } = req.body; // Added description

  if (!customer || !amount) {
    return res.status(400).json({
      message: "customer and amount are required",
    });
  }

  const payAmount = parseFloat(amount);
  const transaction = await sequelize.transaction();

  try {
    /* =====================================================
       1. Get Remain record by customerId
    ===================================================== */
    const remain = await Remain.findOne({
      where: { customerId: customer },
      transaction,
    });

    if (!remain || !remain.orderId || remain.orderId.length === 0) {
      await transaction.rollback();
      return res.status(404).json({
        message: "No remaining orders found for this customer",
      });
    }

    const allOrderIds = remain.orderId;
    const remainOrders = remain.remainOrders || [];
    const receiptOrders = remain.receiptOrders || [];

    /* =====================================================
       2. Find OrderItems using remainOrders (unpaid orders)
    ===================================================== */
    const orderItems = await OrderItem.findAll({
      where: { id: remainOrders },
      transaction,
    });

    if (!orderItems.length) {
      await transaction.rollback();
      return res.status(404).json({
        message: "Order items not found",
      });
    }

    /* =====================================================
       3. Filter unpaid items (receipt < money)
    ===================================================== */
    const unpaidItems = orderItems
      .map(item => ({
        ...item.toJSON(),
        receipt: parseFloat(item.receipt || 0),
        money: parseFloat(item.money || 0),
      }))
      .filter(item => item.receipt < item.money);

    if (!unpaidItems.length) {
      await transaction.rollback();
      return res.status(400).json({
        message: "All orders are already fully paid",
      });
    }

    /* =====================================================
       4. Pay starting from minimal ID
    ===================================================== */
    unpaidItems.sort((a, b) => a.id - b.id);

    let remainingAmount = payAmount;
    const paymentDetails = [];
    const fullyPaidOrderIds = [];
    const updatedRemainOrders = [...remainOrders];
    const updatedReceiptOrders = [...receiptOrders];

    for (const item of unpaidItems) {
      if (remainingAmount <= 0) break;

      const remainingToPay = item.money - item.receipt;
      if (remainingToPay <= 0) continue;

      const payNow = Math.min(remainingToPay, remainingAmount);
      const newReceiptAmount = item.receipt + payNow;

      // Update OrderItem receipt
      await OrderItem.update(
        { receipt: newReceiptAmount },
        { where: { id: item.id }, transaction }
      );

      paymentDetails.push({
        orderId: item.id,
        paid: payNow,
        previousReceipt: item.receipt,
        newReceipt: newReceiptAmount,
        remaining: item.money - newReceiptAmount
      });

      remainingAmount -= payNow;

      // Check if order is fully paid
      const isFullyPaid = Math.abs(item.money - newReceiptAmount) < 0.01;

      if (isFullyPaid) {
        // Track fully paid order IDs
        fullyPaidOrderIds.push(item.id);

        // Remove from remainOrders array
        const index = updatedRemainOrders.indexOf(item.id);
        if (index > -1) {
          updatedRemainOrders.splice(index, 1);
        }

        // Add to receiptOrders array
        if (!updatedReceiptOrders.includes(item.id)) {
          updatedReceiptOrders.push(item.id);
        }
      }
    }

    /* =====================================================
       5. Update all three fields in Remain model
       IMPORTANT: Update orderId, remainOrders, and receiptOrders
    ===================================================== */
    // Remove receiptOrders from remainOrders
    const finalRemainOrders = updatedRemainOrders.filter(
      orderId => !updatedReceiptOrders.includes(orderId)
    );

    // orderId should contain ALL orders (remainOrders + receiptOrders)
    const allOrders = [...new Set([...finalRemainOrders, ...updatedReceiptOrders])];

    await Remain.update(
      {
        orderId: allOrders,           // All orders
        remainOrders: finalRemainOrders,  // Only unpaid orders
        receiptOrders: updatedReceiptOrders, // Only fully paid orders
      },
      { where: { customerId: customer }, transaction }
    );

    /* =====================================================
       6. Create Receipt record with calculated and description fields
    ===================================================== */
    const receiptData = {
      customer,
      amount: payAmount,
      paymentDetails: JSON.stringify(paymentDetails),
      remainingAmount: remainingAmount > 0 ? remainingAmount : 0,
      description: description || null, // Add description field
    };

    // Add calculated field if provided
    if (calculated !== undefined) {
      receiptData.calculated = Boolean(calculated);
    }

    const receiptRecord = await Receipt.create(receiptData, { transaction });

    await transaction.commit();

    return res.status(201).json({
      message: "Receipt created successfully",
      receipt: receiptRecord,
      paymentDetails,
      distributedAmount: payAmount - remainingAmount,
      remainingAmount,
      fullyPaidOrderIds,
      orderId: allOrders,            // All orders
      remainOrders: finalRemainOrders,   // Only unpaid orders
      receiptOrders: updatedReceiptOrders, // Only fully paid orders
    });

  } catch (error) {
    await transaction.rollback();
    console.error(error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

/* =====================================================
   GET RECEIPTS BY DATE RANGE
===================================================== */
export const getReceiptsByDateRange = async (req, res) => {
  const { from, to, customerId } = req.query;

  if (!from || !to) {
    return res.status(400).json({
      success: false,
      message: "from and to dates are required",
    });
  }

  try {
    // Convert to full day range
    const startDate = new Date(`${from}T00:00:00`);
    const endDate = new Date(`${to}T23:59:59`);

    // Build where clause
    const whereClause = {
      createdAt: {
        [Op.between]: [startDate, endDate],
      },
    };

    // Add customer filter if provided
    if (customerId) {
      whereClause.customer = customerId;
    }

    const receipts = await Receipt.findAll({
      where: whereClause,
      include: [
        {
          model: Customer,
          as: "Customer", // ⚠️ MUST match your association alias
          attributes: ["id", "fullname", "phoneNumber"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Calculate totals
    const totalAmount = receipts.reduce(
      (sum, r) => sum + parseFloat(r.amount || 0),
      0
    );

    const totalDistributed = receipts.reduce(
      (sum, r) =>
        sum +
        (parseFloat(r.amount || 0) -
          parseFloat(r.remainingAmount || 0)),
      0
    );

    const totalRemaining = receipts.reduce(
      (sum, r) => sum + parseFloat(r.remainingAmount || 0),
      0
    );

    return res.status(200).json({
      success: true,
      message: "Receipts fetched successfully",
      data: {
        receipts,
        totalCount: receipts.length,
        totalAmount,
        totalDistributed,
        totalRemaining,
        filters: {
          from,
          to,
          customerId: customerId || null,
        },
      },
    });

  } catch (error) {
    console.error("Error in getReceiptsByDateRange:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching receipts",
      error: error.message,
    });
  }
};

/* =====================================================
   GET ALL RECEIPTS (from Receipt table)
===================================================== */
export const getAllReceipts = async (req, res) => {
  try {
    const {
      customerId,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      calculated,
      searchDescription, // Added search by description
      page = 1,
      limit = 20
    } = req.query;

    const where = {};

    if (customerId) where.customer = customerId;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    if (minAmount || maxAmount) {
      where.amount = {};
      if (minAmount) where.amount[Op.gte] = parseFloat(minAmount);
      if (maxAmount) where.amount[Op.lte] = parseFloat(maxAmount);
    }

    if (calculated !== undefined) {
      where.calculated = calculated === "true";
    }

    // Add description search
    if (searchDescription) {
      where.description = {
        [Op.like]: `%${searchDescription}%`
      };
    }

    const pageNumber = parseInt(page);
    const pageLimit = parseInt(limit);
    const offset = (pageNumber - 1) * pageLimit;

    const { rows: receipts, count } = await Receipt.findAndCountAll({
      where,
      include: [
        {
          model: Customer,
          attributes: ["id", "fullname", "phoneNumber", "isActive"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: pageLimit,
      offset: offset,
    });

    const totalAmount = receipts.reduce(
      (sum, receipt) => sum + parseFloat(receipt.amount || 0),
      0
    );

    const calculatedTotal = receipts
      .filter((r) => r.calculated)
      .reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);

    const manualTotal = receipts
      .filter((r) => !r.calculated)
      .reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);

    res.json({
      success: true,
      page: pageNumber,
      limit: pageLimit,
      totalRecords: count,
      totalPages: Math.ceil(count / pageLimit),

      totalAmount,
      calculatedTotal,
      manualTotal,

      summary: {
        totalReceipts: count,
        calculatedReceipts: receipts.filter((r) => r.calculated).length,
        manualReceipts: receipts.filter((r) => !r.calculated).length,
      },

      data: receipts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error fetching receipts",
      error: error.message,
    });
  }
};

/* =====================================================
   GET RECEIPT BY ID (from Receipt table)
===================================================== */
export const getReceiptById = async (req, res) => {
  try {
    const receipt = await Receipt.findByPk(req.params.id, {
      include: [{
        model: Customer,
        attributes: ["id", "fullname", "phoneNumber", "isActive"],
      }],
    });

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: "Receipt not found",
      });
    }

    res.json({
      success: true,
      data: receipt,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error fetching receipt",
      error: error.message,
    });
  }
};

/* =====================================================
   UPDATE RECEIPT (with payment redistribution)
===================================================== */
export const updateReceipt = async (req, res) => {
  const { id } = req.params;
  const { amount, calculated, description } = req.body; // Added description

  if (!amount && calculated === undefined && description === undefined) {
    return res.status(400).json({
      message: "At least amount, calculated, or description field must be provided",
    });
  }

  const transaction = await sequelize.transaction();

  try {
    // Get the original receipt
    const receipt = await Receipt.findByPk(id, { transaction });
    if (!receipt) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Receipt not found",
      });
    }

    const updateData = {};

    // Update description field if provided
    if (description !== undefined) {
      updateData.description = description;
    }

    // Update calculated field if provided
    if (calculated !== undefined) {
      updateData.calculated = Boolean(calculated);
    }

    // Handle amount update if provided
    if (amount !== undefined) {
      const newAmount = parseFloat(amount);
      const oldAmount = parseFloat(receipt.amount || 0);
      const amountDifference = newAmount - oldAmount;

      if (amountDifference !== 0) {
        const customerId = receipt.customer;

        // Get customer's remain record
        const remain = await Remain.findOne({
          where: { customerId },
          transaction,
        });

        if (!remain || !remain.orderId || remain.orderId.length === 0) {
          await transaction.rollback();
          return res.status(404).json({
            message: "No orders found for this customer",
          });
        }

        if (amountDifference > 0) {
          // Adding more payment - distribute to unpaid orders
          const orderIds = remain.orderId;
          const orderItems = await OrderItem.findAll({
            where: { id: orderIds },
            transaction,
          });

          const unpaidItems = orderItems
            .map(item => ({
              ...item.toJSON(),
              receipt: parseFloat(item.receipt || 0),
              money: parseFloat(item.money || 0),
            }))
            .filter(item => item.receipt < item.money)
            .sort((a, b) => a.id - b.id);

          let remainingAmount = amountDifference;
          const newPaymentDetails = [];

          for (const item of unpaidItems) {
            if (remainingAmount <= 0) break;

            const remainingToPay = item.money - item.receipt;
            if (remainingToPay <= 0) continue;

            const payNow = Math.min(remainingToPay, remainingAmount);

            await OrderItem.update(
              {
                receipt: item.receipt + payNow,
              },
              {
                where: { id: item.id },
                transaction,
              }
            );

            newPaymentDetails.push({
              orderId: item.id,
              additionalPaid: payNow,
              newReceipt: item.receipt + payNow,
            });

            remainingAmount -= payNow;
          }

          // Get existing payment details
          const oldPaymentDetails = receipt.paymentDetails ? JSON.parse(receipt.paymentDetails) : [];
          const updatedPaymentDetails = [...oldPaymentDetails, ...newPaymentDetails];

          updateData.amount = newAmount;
          updateData.paymentDetails = JSON.stringify(updatedPaymentDetails);
          updateData.remainingAmount = remainingAmount > 0 ? remainingAmount : 0;

        } else {
          // Reducing payment - need to handle carefully
          await transaction.rollback();
          return res.status(400).json({
            message: "Reducing receipt amount is not supported. Please create a refund receipt instead.",
          });
        }
      }
    }

    // Update the receipt
    await receipt.update(updateData, { transaction });

    await transaction.commit();

    return res.json({
      success: true,
      message: "Receipt updated successfully",
      data: receipt,
    });

  } catch (error) {
    await transaction.rollback();
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Error updating receipt",
      error: error.message,
    });
  }
};

/* =====================================================
   BULK UPDATE CALCULATED FIELD
===================================================== */
export const bulkUpdateCalculated = async (req, res) => {
  try {
    const { ids, calculated } = req.body;

    if (!Array.isArray(ids) || ids.length === 0 || calculated === undefined) {
      return res.status(400).json({
        success: false,
        message: "ids array and calculated flag are required",
      });
    }

    const [affectedCount] = await Receipt.update(
      { calculated: Boolean(calculated) },
      {
        where: {
          id: ids
        }
      }
    );

    res.json({
      success: true,
      message: `Successfully updated ${affectedCount} receipt(s)`,
      affectedCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error bulk updating receipts",
      error: error.message,
    });
  }
};

/* =====================================================
   BULK UPDATE DESCRIPTION
===================================================== */
export const bulkUpdateDescription = async (req, res) => {
  try {
    const { ids, description } = req.body;

    if (!Array.isArray(ids) || ids.length === 0 || description === undefined) {
      return res.status(400).json({
        success: false,
        message: "ids array and description are required",
      });
    }

    const [affectedCount] = await Receipt.update(
      { description },
      {
        where: {
          id: ids
        }
      }
    );

    res.json({
      success: true,
      message: `Successfully updated description for ${affectedCount} receipt(s)`,
      affectedCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error bulk updating descriptions",
      error: error.message,
    });
  }
};

/* =====================================================
   GET RECEIPTS BY CUSTOMER
===================================================== */
export const getReceiptsByCustomer = async (req, res) => {
  try {
    const customerId = req.params.customerId;
    const { calculated } = req.query;

    // Check if customer exists
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Build where clause
    const where = { customer: customerId };
    if (calculated !== undefined) {
      where.calculated = calculated === 'true';
    }

    // Get receipts for this customer
    const receipts = await Receipt.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });

    // Get all order items for this customer to calculate statistics
    const remain = await Remain.findOne({
      where: { customerId },
    });

    let totalOrderAmount = 0;
    let totalPaid = 0;
    let unpaidOrders = [];

    if (remain && remain.orderId && remain.orderId.length > 0) {
      const orderItems = await OrderItem.findAll({
        where: { id: remain.orderId },
      });

      orderItems.forEach(item => {
        const money = parseFloat(item.money || 0);
        const receipt = parseFloat(item.receipt || 0);
        totalOrderAmount += money;
        totalPaid += receipt;

        if (receipt < money) {
          unpaidOrders.push({
            id: item.id,
            size: item.size,
            money: money,
            paid: receipt,
            remaining: money - receipt,
          });
        }
      });
    }

    const totalReceiptAmount = receipts.reduce((sum, receipt) =>
      sum + parseFloat(receipt.amount || 0), 0
    );

    const calculatedTotal = receipts.filter(r => r.calculated).reduce((sum, r) =>
      sum + parseFloat(r.amount || 0), 0
    );
    const manualTotal = receipts.filter(r => !r.calculated).reduce((sum, r) =>
      sum + parseFloat(r.amount || 0), 0
    );

    res.json({
      success: true,
      customer: {
        id: customer.id,
        fullname: customer.fullname,
        phoneNumber: customer.phoneNumber,
        isActive: customer.isActive,
      },
      statistics: {
        totalReceipts: receipts.length,
        calculatedReceipts: receipts.filter(r => r.calculated).length,
        manualReceipts: receipts.filter(r => !r.calculated).length,
        totalReceiptAmount,
        calculatedTotal,
        manualTotal,
        totalOrderAmount,
        totalPaid,
        remainingAmount: totalOrderAmount - totalPaid,
        unpaidOrdersCount: unpaidOrders.length,
      },
      unpaidOrders,
      receipts: receipts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error fetching customer receipts",
      error: error.message,
    });
  }
};

/* =====================================================
   DELETE RECEIPT (Recalculate Remain from OrderItems)
===================================================== */
export const deleteReceipt = async (req, res) => {
  const { id } = req.params;

  const transaction = await sequelize.transaction();

  try {
    // Get the receipt
    const receipt = await Receipt.findByPk(id, { transaction });
    if (!receipt) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Receipt not found",
      });
    }

    const customerId = receipt.customer;
    const paymentDetails = receipt.paymentDetails ? JSON.parse(receipt.paymentDetails) : [];

    // Get the customer's Remain record
    const remain = await Remain.findOne({
      where: { customerId },
      transaction,
    });

    if (!remain) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Customer record not found",
      });
    }

    // Get all order IDs from remain
    const allOrderIds = remain.orderId || [];

    // Reverse payments first
    if (paymentDetails.length > 0) {
      for (const payment of paymentDetails) {
        const orderItem = await OrderItem.findByPk(payment.orderId, { transaction });
        if (orderItem) {
          const currentReceipt = parseFloat(orderItem.receipt || 0);
          const paidAmount = payment.paid || payment.additionalPaid || 0;

          // Subtract the paid amount
          const newReceipt = Math.max(0, currentReceipt - paidAmount);

          await OrderItem.update(
            { receipt: newReceipt },
            {
              where: { id: payment.orderId },
              transaction,
            }
          );
        }
      }
    }

    // Now recalculate remainOrders and receiptOrders from OrderItems
    if (allOrderIds.length > 0) {
      const orderItems = await OrderItem.findAll({
        where: { id: allOrderIds },
        transaction,
      });

      const newRemainOrders = [];
      const newReceiptOrders = [];

      orderItems.forEach(item => {
        const orderId = item.id;
        const money = parseFloat(item.money || 0);
        const receiptPaid = parseFloat(item.receipt || 0);

        // Check if order is fully paid (allow small floating point differences)
        const isFullyPaid = Math.abs(money - receiptPaid) < 0.01;

        if (isFullyPaid) {
          newReceiptOrders.push(orderId);
        } else {
          newRemainOrders.push(orderId);
        }
      });

      // Update the Remain record with recalculated values
      await Remain.update(
        {
          remainOrders: newRemainOrders,
          receiptOrders: newReceiptOrders,
          // orderId remains the same
        },
        {
          where: { customerId },
          transaction,
        }
      );
    }

    // Delete the receipt record
    await receipt.destroy({ transaction });

    await transaction.commit();

    return res.json({
      success: true,
      message: "Receipt deleted and payments reversed successfully",
      deletedReceipt: receipt,
      details: {
        receiptId: receipt.id,
        amount: receipt.amount,
        calculated: receipt.calculated,
        description: receipt.description, // Include description in response
        customerId: customerId,
        ordersAffected: paymentDetails.length,
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Error deleting receipt",
      error: error.message,
    });
  }
};

/* =====================================================
   RECEIPT STATISTICS
===================================================== */
export const getReceiptStatistics = async (req, res) => {
  try {
    const { startDate, endDate, calculated } = req.query;

    const where = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    if (calculated !== undefined) {
      where.calculated = calculated === 'true';
    }

    // Get all receipts
    const receipts = await Receipt.findAll({ where });

    // Get all customers for breakdown
    const customers = await Customer.findAll({
      include: [{
        model: Receipt,
        required: false,
        where: calculated !== undefined ? { calculated: calculated === 'true' } : undefined,
      }],
    });

    // Calculate statistics
    const totalReceipts = receipts.length;
    const totalAmount = receipts.reduce((sum, receipt) =>
      sum + parseFloat(receipt.amount || 0), 0
    );
    const averageAmount = totalReceipts > 0 ? totalAmount / totalReceipts : 0;

    const calculatedReceipts = receipts.filter(r => r.calculated);
    const manualReceipts = receipts.filter(r => !r.calculated);

    const calculatedTotal = calculatedReceipts.reduce((sum, r) =>
      sum + parseFloat(r.amount || 0), 0
    );
    const manualTotal = manualReceipts.reduce((sum, r) =>
      sum + parseFloat(r.amount || 0), 0
    );

    // Group by customer
    const customerStats = [];
    for (const customer of customers) {
      const customerReceipts = receipts.filter(r => r.customer === customer.id);
      const customerTotal = customerReceipts.reduce((sum, receipt) =>
        sum + parseFloat(receipt.amount || 0), 0
      );

      // Get customer's unpaid amount from orders
      let unpaidAmount = 0;
      const remain = await Remain.findOne({
        where: { customerId: customer.id },
      });

      if (remain && remain.orderId && remain.orderId.length > 0) {
        const orderItems = await OrderItem.findAll({
          where: { id: remain.orderId },
        });

        orderItems.forEach(item => {
          const money = parseFloat(item.money || 0);
          const receipt = parseFloat(item.receipt || 0);
          unpaidAmount += Math.max(0, money - receipt);
        });
      }

      customerStats.push({
        customerId: customer.id,
        customerName: customer.fullname,
        receiptCount: customerReceipts.length,
        totalPaid: customerTotal,
        unpaidAmount: unpaidAmount,
        calculatedReceipts: customerReceipts.filter(r => r.calculated).length,
        manualReceipts: customerReceipts.filter(r => !r.calculated).length,
      });
    }

    // Daily statistics
    const dailyStats = {};
    receipts.forEach(receipt => {
      const date = receipt.createdAt.toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = {
          date,
          count: 0,
          calculatedCount: 0,
          manualCount: 0,
          totalAmount: 0,
          calculatedAmount: 0,
          manualAmount: 0,
        };
      }
      dailyStats[date].count++;
      const amount = parseFloat(receipt.amount);
      dailyStats[date].totalAmount += amount;

      if (receipt.calculated) {
        dailyStats[date].calculatedCount++;
        dailyStats[date].calculatedAmount += amount;
      } else {
        dailyStats[date].manualCount++;
        dailyStats[date].manualAmount += amount;
      }
    });

    res.json({
      success: true,
      statistics: {
        totalReceipts,
        calculatedReceipts: calculatedReceipts.length,
        manualReceipts: manualReceipts.length,
        totalAmount: totalAmount.toFixed(2),
        calculatedTotal: calculatedTotal.toFixed(2),
        manualTotal: manualTotal.toFixed(2),
        averageAmount: averageAmount.toFixed(2),
        byCustomer: customerStats,
        daily: Object.values(dailyStats),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error fetching statistics",
      error: error.message,
    });
  }
};

/* =====================================================
   GET CUSTOMER PAYMENT SUMMARY
===================================================== */
export const getCustomerPaymentSummary = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { calculated } = req.query;

    // Check if customer exists
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Build where clause for receipts
    const receiptWhere = { customer: customerId };
    if (calculated !== undefined) {
      receiptWhere.calculated = calculated === 'true';
    }

    // Get customer's remain record
    const remain = await Remain.findOne({
      where: { customerId },
    });

    let totalOrderAmount = 0;
    let totalPaid = 0;
    let orderDetails = [];

    if (remain && remain.orderId && remain.orderId.length > 0) {
      const orderItems = await OrderItem.findAll({
        where: { id: remain.orderId },
      });

      orderDetails = orderItems.map(item => {
        const money = parseFloat(item.money || 0);
        const receipt = parseFloat(item.receipt || 0);
        totalOrderAmount += money;
        totalPaid += receipt;

        return {
          id: item.id,
          size: item.size,
          fileName: item.fileName,
          createdAt: item.createdAt,
          money: money,
          paid: receipt,
          remaining: money - receipt,
          status: receipt >= money ? "paid" : receipt > 0 ? "partial" : "unpaid",
        };
      });
    }

    // Get all receipts for this customer
    const receipts = await Receipt.findAll({
      where: receiptWhere,
      order: [["createdAt", "DESC"]],
    });

    const totalReceiptAmount = receipts.reduce((sum, receipt) =>
      sum + parseFloat(receipt.amount || 0), 0
    );

    const calculatedReceipts = receipts.filter(r => r.calculated);
    const manualReceipts = receipts.filter(r => !r.calculated);

    const calculatedTotal = calculatedReceipts.reduce((sum, r) =>
      sum + parseFloat(r.amount || 0), 0
    );
    const manualTotal = manualReceipts.reduce((sum, r) =>
      sum + parseFloat(r.amount || 0), 0
    );

    res.json({
      success: true,
      customer: {
        id: customer.id,
        fullname: customer.fullname,
        phoneNumber: customer.phoneNumber,
        isActive: customer.isActive,
      },
      summary: {
        totalOrders: orderDetails.length,
        totalOrderAmount,
        totalPaid,
        remainingAmount: totalOrderAmount - totalPaid,
        totalReceipts: receipts.length,
        calculatedReceipts: calculatedReceipts.length,
        manualReceipts: manualReceipts.length,
        totalReceiptAmount,
        calculatedTotal,
        manualTotal,
      },
      orderDetails,
      receipts: receipts.map(r => ({
        id: r.id,
        amount: r.amount,
        calculated: r.calculated,
        description: r.description, // Include description
        createdAt: r.createdAt,
        paymentDetails: r.paymentDetails ? JSON.parse(r.paymentDetails) : [],
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error fetching payment summary",
      error: error.message,
    });
  }
};

/* =====================================================
   GET RECEIPT SUMMARY (for dashboard)
===================================================== */
export const getReceiptSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    const receipts = await Receipt.findAll({ where });

    const totalAmount = receipts.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
    const calculatedAmount = receipts.filter(r => r.calculated).reduce((sum, r) =>
      sum + parseFloat(r.amount || 0), 0
    );
    const manualAmount = receipts.filter(r => !r.calculated).reduce((sum, r) =>
      sum + parseFloat(r.amount || 0), 0
    );

    // Group by customer
    const customerGroups = {};
    receipts.forEach(receipt => {
      if (!customerGroups[receipt.customer]) {
        customerGroups[receipt.customer] = {
          total: 0,
          calculated: 0,
          manual: 0,
          count: 0
        };
      }
      const amount = parseFloat(receipt.amount);
      customerGroups[receipt.customer].total += amount;
      customerGroups[receipt.customer].count++;

      if (receipt.calculated) {
        customerGroups[receipt.customer].calculated += amount;
      } else {
        customerGroups[receipt.customer].manual += amount;
      }
    });

    // Get customer names
    const customerIds = Object.keys(customerGroups);
    const customers = await Customer.findAll({
      where: { id: customerIds },
      attributes: ['id', 'fullname']
    });

    const customerStats = customers.map(customer => ({
      customerId: customer.id,
      customerName: customer.fullname,
      ...customerGroups[customer.id]
    }));

    res.json({
      success: true,
      summary: {
        totalReceipts: receipts.length,
        totalAmount,
        calculatedAmount,
        manualAmount,
        calculatedPercentage: totalAmount > 0 ? (calculatedAmount / totalAmount * 100).toFixed(2) : 0,
        manualPercentage: totalAmount > 0 ? (manualAmount / totalAmount * 100).toFixed(2) : 0,
      },
      customerStats: customerStats.sort((a, b) => b.total - a.total).slice(0, 10), // Top 10 customers
      dailyStats: await getDailyReceiptStats(where),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error fetching receipt summary",
      error: error.message,
    });
  }
};

/* =====================================================
   SEARCH RECEIPTS BY DESCRIPTION
===================================================== */
export const searchReceiptsByDescription = async (req, res) => {
  try {
    const { query, page = 1, limit = 20 } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const pageNumber = parseInt(page);
    const pageLimit = parseInt(limit);
    const offset = (pageNumber - 1) * pageLimit;

    const { rows: receipts, count } = await Receipt.findAndCountAll({
      where: {
        description: {
          [Op.like]: `%${query}%`
        }
      },
      include: [
        {
          model: Customer,
          attributes: ["id", "fullname", "phoneNumber"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: pageLimit,
      offset: offset,
    });

    const totalAmount = receipts.reduce(
      (sum, receipt) => sum + parseFloat(receipt.amount || 0),
      0
    );

    res.json({
      success: true,
      page: pageNumber,
      limit: pageLimit,
      totalRecords: count,
      totalPages: Math.ceil(count / pageLimit),
      totalAmount,
      data: receipts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error searching receipts",
      error: error.message,
    });
  }
};

/* =====================================================
   HELPER: Get daily receipt statistics
===================================================== */
async function getDailyReceiptStats(where) {
  const receipts = await Receipt.findAll({
    where,
    attributes: [
      [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      [sequelize.fn('SUM', sequelize.col('amount')), 'total'],
      [sequelize.literal(`SUM(CASE WHEN calculated = true THEN amount ELSE 0 END)`), 'calculated'],
      [sequelize.literal(`SUM(CASE WHEN calculated = false THEN amount ELSE 0 END)`), 'manual']
    ],
    group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
    order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'DESC']],
    limit: 30 // Last 30 days
  });

  return receipts.map(r => ({
    date: r.get('date'),
    count: parseInt(r.get('count') || 0),
    total: parseFloat(r.get('total') || 0),
    calculated: parseFloat(r.get('calculated') || 0),
    manual: parseFloat(r.get('manual') || 0),
  }));
}