import { Op, QueryTypes, Sequelize } from "sequelize";
import sequelize from "../dbconnection.js";
import Owner from "../Models/owners.js";
import Money from "../Models/Money.js";
import Customer from "../Models/Customers.js";
import OrderItem from "../Models/OrderItems.js";
import Receipt from "../Models/Receipt.js";
import Remain from "../Models/Remain.js";
import Expense from "../Models/Expense.js";
import Staff from "../Models/staff/staff.js";
import Attendance from "../Models/Attendence.js";
import Exist from "../Models/Stock/exist.js";
import Income from "../Models/Stock/income.js";
import Outgoing from "../Models/Stock/outgoing.js";
import User from "../Models/user.js";

/**
 * Generate Complete System Report
 */

export const generateCompleteReport = async (req, res) => {
  try {
    /* ============================
       1. TOTAL MONEY ON CUSTOMERS
    ============================ */
    const remains = await Remain.findAll({
      attributes: ["remainOrders"],
    });

    const orderItemIds = remains
      .flatMap(r => r.remainOrders || [])
      .filter(Boolean);

    let totalMoneyOnCustomers = 0;

    if (orderItemIds.length > 0) {
      const orderItems = await OrderItem.findAll({
        where: { id: { [Op.in]: orderItemIds } },
        attributes: ["money", "receipt"],
      });

      totalMoneyOnCustomers = orderItems.reduce(
        (sum, item) => sum + (item.money - item.receipt),
        0
      );
    }

    /* ============================
       2. TOTAL MONEY ON OWNERS
    ============================ */
    const totalMoneyOnOwners = await Money.sum("amount", {
      where: { calculated: false },
    }) || 0;

    /* ============================
       3. TOTAL RECEIPT FROM CUSTOMERS
    ============================ */
    const totalReceiptFromCustomers = await Receipt.sum("amount", {
      where: { calculated: false },
    }) || 0;

    /* ============================
       4. TOTAL PAID (ATTENDANCE)
    ============================ */
    const totalPaid = await Attendance.sum("receipt", {
      where: { calculated: false },
    }) || 0;

    /* ============================
       5. TOTAL EXPENSE
    ============================ */
    const totalExpense = await Expense.sum("amount", {
      where: { calculated: false },
    }) || 0;

/* ============================
   6. TOTAL UNPAID SALARY FROM ATTENDANCE
   (Records where calculated = false)
============================ */
const attendanceSummary = await Attendance.findOne({
  attributes: [
    [Sequelize.fn('SUM', Sequelize.col('total')), 'totalSalary'],
    [Sequelize.fn('SUM', Sequelize.col('receipt')), 'totalPaid']
  ],
  where: { calculated: false },
  raw: true
});

const totalSalary = parseFloat(attendanceSummary?.totalSalary) || 0;
const totalPaidSalary = parseFloat(attendanceSummary?.totalPaid) || 0;
const totalUnpaidSalary = Math.max(totalSalary - totalPaidSalary, 0);

/* ============================
   RESPONSE
============================ */
res.status(200).json({
  success: true,
  message: "Complete financial report generated successfully",
  data: {
    totalMoneyOnCustomers,
    totalMoneyOnOwners,
    totalReceiptFromCustomers,
    totalPaid: totalPaidSalary, // Update to use attendance-based paid salary
    totalExpense,
    totalUnpaidSalary,
    
    // Net profit calculation considering unpaid salary as liability
    netProfit: (totalMoneyOnOwners + totalReceiptFromCustomers) - 
               (totalPaidSalary + totalExpense + totalUnpaidSalary),
    
    // Additional insights
    totalSalaryLiability: totalSalary, // Total salary that needs to be paid
    salaryPaymentRatio: totalSalary > 0 ? (totalPaidSalary / totalSalary) * 100 : 0
  },
});

  } catch (error) {
    console.error("Report error:", error);
    res.status(500).json({
      success: false,
      message: "Error generating complete report",
      error: error.message,
    });
  }
};

// Helper function to calculate the requested statistics
async function getRequestedStatistics(dateFilter) {
    try {
        // 1. total of (money-receipt) in table orderItems that their id is in remain property of table remains
        const remainRecords = await Remain.findAll({
            where: dateFilter,
            attributes: ['remainOrders', 'customerId']
        });

        let allRemainOrderIds = [];
        let totalMoneyMinusReceipt = 0;
        let remainOrderDetails = [];

        remainRecords.forEach(record => {
            if (record.remainOrders && Array.isArray(record.remainOrders)) {
                allRemainOrderIds = [...allRemainOrderIds, ...record.remainOrders];
            }
        });

        const uniqueOrderIds = [...new Set(allRemainOrderIds.filter(id => id))];

        if (uniqueOrderIds.length > 0) {
            const orderItems = await OrderItem.findAll({
                where: {
                    id: uniqueOrderIds,
                    ...dateFilter
                },
                attributes: ['id', 'money', 'receipt', 'customerId', 'createdAt']
            });

            orderItems.forEach(item => {
                const money = parseFloat(item.money || 0);
                const receipt = parseFloat(item.receipt || 0);
                const difference = money - receipt;

                if (difference > 0) {
                    totalMoneyMinusReceipt += difference;
                    remainOrderDetails.push({
                        orderId: item.id,
                        customerId: item.customerId,
                        money: money,
                        receipt: receipt,
                        difference: difference,
                        date: item.createdAt
                    });
                }
            });
        }

        // 2. total of amount property that its calculated property is false in table money
        const manualMoneyTotal = await Money.sum('amount', {
            where: {
                ...dateFilter,
                calculated: false
            }
        });

        // 3. total of amount property that its calculated property is false in table receipts
        const manualReceiptsTotal = await Receipt.sum('amount', {
            where: {
                ...dateFilter,
                calculated: false
            }
        });

        // 4. total of (receipt-total) in table attendance
        const attendanceRecords = await Attendance.findAll({
            where: dateFilter,
            attributes: ['id', 'receipt', 'total']
        });

        let totalReceiptMinusTotal = 0;
        let attendanceDetails = [];

        attendanceRecords.forEach(att => {
            const receipt = parseFloat(att.receipt || 0);
            const total = parseFloat(att.total || 0);
            const difference = receipt - total;

            totalReceiptMinusTotal += difference;
            attendanceDetails.push({
                attendanceId: att.id,
                receipt: receipt,
                total: total,
                difference: difference
            });
        });

        return {
            totalMoneyMinusReceipt: totalMoneyMinusReceipt || 0,
            manualMoneyTotal: manualMoneyTotal || 0,
            manualReceiptsTotal: manualReceiptsTotal || 0,
            totalReceiptMinusTotal: totalReceiptMinusTotal || 0,
            details: {
                remainOrders: {
                    count: uniqueOrderIds.length,
                    orders: remainOrderDetails,
                    averageDifference: uniqueOrderIds.length > 0 ? totalMoneyMinusReceipt / uniqueOrderIds.length : 0
                },
                manualTransactions: {
                    moneyRecords: await Money.count({ where: { ...dateFilter, calculated: false } }),
                    receiptRecords: await Receipt.count({ where: { ...dateFilter, calculated: false } })
                },
                attendance: {
                    records: attendanceRecords.length,
                    details: attendanceDetails
                }
            }
        };

    } catch (error) {
        console.error("Error calculating requested statistics:", error);
        return {
            totalMoneyMinusReceipt: 0,
            manualMoneyTotal: 0,
            manualReceiptsTotal: 0,
            totalReceiptMinusTotal: 0,
            details: {
                remainOrders: { count: 0, orders: [], averageDifference: 0 },
                manualTransactions: { moneyRecords: 0, receiptRecords: 0 },
                attendance: { records: 0, details: [] }
            },
            error: error.message
        };
    }
}

// 1. Generate Complete All-in-One Report
async function generateAllReport(dateFilter, ownerId, customerId, staffId) {
    const [
        financial,
        customers,
        staff,
        inventory,
        system,
        summary,
        requestedStats
    ] = await Promise.all([
        generateFinancialData(dateFilter, ownerId), 
        getRequestedStatistics(dateFilter) // Add requested statistics
    ]);

    return {
        reportDate: new Date().toISOString(),
        period: dateFilter.createdAt ? `${startDate} to ${endDate}` : 'All Time',
        summary,
        financial: {
            ...financial,
            requestedStatistics: requestedStats // Include in financial section
        },
        customers,
        staff,
        inventory,
        system
    };
}

// 2. Generate Financial Report
async function generateFinancialReport(dateFilter, ownerId) {
    const [financialData, requestedStats] = await Promise.all([
        generateFinancialData(dateFilter, ownerId),
        getRequestedStatistics(dateFilter)
    ]);

    return {
        reportType: 'financial',
        reportDate: new Date().toISOString(),
        ...financialData,
        requestedStatistics: requestedStats
    };
}

// Financial Data Generator - Updated to include requested stats
async function generateFinancialData(dateFilter, ownerId) {
    const moneyWhere = { ...dateFilter };
    if (ownerId) moneyWhere.ownerId = ownerId;

    const expenseWhere = { ...dateFilter };
    const receiptWhere = { ...dateFilter };

    // Get all data in parallel including requested statistics
    const [
        moneyRecords,
        expenseRecords,
        receiptRecords,
        orderItems,
        totalMoney,
        totalExpenses,
        totalReceipts,
        totalOrderMoney,
        ownerSummary,
        requestedStats // Add requested statistics
    ] = await Promise.all([
        Money.findAll({
            where: moneyWhere,
            include: [{ model: Owner, as: 'owner' }],
            order: [['createdAt', 'DESC']]
        }),
        Expense.findAll({ where: expenseWhere, order: [['createdAt', 'DESC']] }),
        Receipt.findAll({
            where: receiptWhere,
            include: [{ model: Customer }],
            order: [['createdAt', 'DESC']]
        }),
        OrderItem.findAll({
            where: dateFilter,
            include: [{ model: Customer, as: 'customer' }],
            order: [['createdAt', 'DESC']]
        }),
        Money.sum('amount', { where: moneyWhere }),
        Expense.sum('amount', { where: expenseWhere }),
        Receipt.sum('amount', { where: receiptWhere }),
        OrderItem.sum('money', { where: dateFilter }),
        getOwnerFinancialSummary(dateFilter, ownerId),
        getRequestedStatistics(dateFilter) // Get requested statistics
    ]);

    const calculatedTotal = moneyRecords.filter(m => m.calculated).reduce((sum, m) => sum + parseFloat(m.amount), 0);
    const manualTotal = moneyRecords.filter(m => !m.calculated).reduce((sum, m) => sum + parseFloat(m.amount), 0);

    const calculatedReceiptsTotal = receiptRecords.filter(r => r.calculated).reduce((sum, r) => sum + parseFloat(r.amount), 0);
    const manualReceiptsTotal = receiptRecords.filter(r => !r.calculated).reduce((sum, r) => sum + parseFloat(r.amount), 0);

    return {
        totals: {
            totalMoney: totalMoney || 0,
            totalExpenses: totalExpenses || 0,
            totalReceipts: totalReceipts || 0,
            totalOrderMoney: totalOrderMoney || 0,
            calculatedMoney: calculatedTotal,
            manualMoney: manualTotal,
            calculatedReceipts: calculatedReceiptsTotal,
            manualReceipts: manualReceiptsTotal,
            netCashFlow: (totalMoney || 0) - (totalExpenses || 0),
            netIncome: (totalMoney || 0) + (totalReceipts || 0) - (totalExpenses || 0)
        },
        requestedStatistics: requestedStats, // Include requested statistics here
        breakdown: {
            moneyRecords: moneyRecords.map(m => ({
                id: m.id,
                owner: m.owner?.name,
                amount: m.amount,
                type: m.calculated ? 'calculated' : 'manual',
                date: m.createdAt
            })),
            expenses: expenseRecords.map(e => ({
                id: e.id,
                purpose: e.purpose,
                by: e.by,
                amount: e.amount,
                date: e.createdAt
            })),
            receipts: receiptRecords.map(r => ({
                id: r.id,
                customer: r.Customer?.fullname,
                amount: r.amount,
                type: r.calculated ? 'calculated' : 'manual',
                date: r.createdAt
            }))
        },
        ownerSummary,
        count: {
            moneyRecords: moneyRecords.length,
            expenses: expenseRecords.length,
            receipts: receiptRecords.length,
            orderItems: orderItems.length,
            calculatedMoneyRecords: moneyRecords.filter(m => m.calculated).length,
            manualMoneyRecords: moneyRecords.filter(m => !m.calculated).length,
            calculatedReceiptRecords: receiptRecords.filter(r => r.calculated).length,
            manualReceiptRecords: receiptRecords.filter(r => !r.calculated).length
        }
    };
}

// The rest of your existing functions remain the same...
// [Previous code continues with generateCustomerData, generateStaffData, etc.]

// ========== UTILITY FUNCTIONS ==========

async function getOwnerFinancialSummary(dateFilter, ownerId) {
    const whereClause = { ...dateFilter };
    if (ownerId) whereClause.ownerId = ownerId;

    const ownerSummary = await Money.findAll({
        attributes: [
            [sequelize.col('Money.ownerId'), 'ownerId'],
            [sequelize.fn('SUM', sequelize.col('Money.amount')), 'totalAmount'],
            [sequelize.fn('COUNT', sequelize.col('Money.id')), 'transactionCount']
        ],
        where: whereClause,
        include: [{ model: Owner, as: 'owner', attributes: ['id', 'name'] }],
        group: ['Money.ownerId', 'owner.id'],
        order: [[sequelize.fn('SUM', sequelize.col('Money.amount')), 'DESC']]
    });

    return ownerSummary.map(os => ({
        ownerId: os.get('ownerId'),
        ownerName: os.owner?.name,
        totalAmount: os.get('totalAmount'),
        transactionCount: os.get('transactionCount')
    }));
}

// Note: You'll need to add the missing variable declarations for startDate and endDate
// in the generateAllReport function or pass them as parameters

// Rest of your existing code continues...