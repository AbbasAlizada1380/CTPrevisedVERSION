import { Employee, Loan, LoanPayment, Wallet } from "../../Models/debt/index.js";
import sequelize from "../../dbconnection.js";
import { Op } from "sequelize";

// @desc    Get company summary report
// @route   GET /api/reports/summary
export const getCompanySummary = async (req, res) => {
  try {
    const totalEmployees = await Employee.count();

    const walletStats = await Wallet.findAll({
      attributes: [
        [sequelize.fn("SUM", sequelize.col("totalLoans")), "totalLoans"],
        [sequelize.fn("SUM", sequelize.col("totalPaid")), "totalPaid"],
        [
          sequelize.fn("SUM", sequelize.col("remainingBalance")),
          "totalRemaining",
        ],
      ],
    });

    const activeLoansCount = await Loan.count({ where: { status: "Active" } });

    const recentLoans = await Loan.findAll({
      limit: 5,
      order: [["createdAt", "DESC"]],
      include: [{ model: Employee, as: "Employee", attributes: ["fullName"] }],
    });

    const recentPayments = await LoanPayment.findAll({
      limit: 5,
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: Loan,
          as: "Loan",
          include: [
            { model: Employee, as: "Employee", attributes: ["fullName"] },
          ],
        },
      ],
    });

    const stats = walletStats[0]?.dataValues || {};

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalEmployees,
          totalActiveLoans: activeLoansCount,
          totalLoanAmount: parseFloat(stats.totalLoans || 0),
          totalPaidAmount: parseFloat(stats.totalPaid || 0),
          totalRemainingBalance: parseFloat(stats.totalRemaining || 0),
        },
        recentActivities: {
          loans: recentLoans,
          payments: recentPayments,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get employee loan history
// @route   GET /api/reports/employee/:employeeId/loans
export const getEmployeeLoanHistory = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const employee = await Employee.findByPk(employeeId, {
      attributes: ["id", "fullName", "phone", "position"],
      include: [
        {
          model: Wallet,
          as: "Wallet",
          attributes: ["totalLoans", "totalPaid", "remainingBalance"],
        },
        {
          model: Loan,
          as: "Loans",
          include: [
            {
              model: LoanPayment,
              as: "LoanPayments",
              attributes: ["id", "amount", "paymentDate", "createdAt"],
            },
          ],
          order: [["loanDate", "DESC"]],
        },
      ],
    });

    if (!employee)
      return res.status(404).json({ success: false, error: "کارمند یافت نشد" });

    const loans = employee.Loans || [];
    const loanStats = loans.reduce(
      (stats, loan) => {
        stats.totalLoans++;
        stats.totalAmount += parseFloat(loan.amount || 0);
        stats.totalPaid += (loan.LoanPayments || []).reduce(
          (sum, p) => sum + parseFloat(p.amount || 0),
          0,
        );
        if (loan.status === "Active") stats.activeLoans++;
        else stats.closedLoans++;
        return stats;
      },
      {
        totalLoans: 0,
        activeLoans: 0,
        closedLoans: 0,
        totalAmount: 0,
        totalPaid: 0,
      },
    );

    res
      .status(200)
      .json({
        success: true,
        data: { employee, statistics: loanStats, loans },
      });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get payments report by date range
// @route   GET /api/reports/payments
export const getPaymentsReport = async (req, res) => {
  try {
    const { startDate, endDate, employeeId } = req.query;
    const whereCondition = {};
    if (startDate && endDate)
      whereCondition.paymentDate = { [Op.between]: [startDate, endDate] };

    const includeCondition = [
      {
        model: Loan,
        as: "Loan",
        include: [
          { model: Employee, as: "Employee", attributes: ["id", "fullName"] },
        ],
      },
    ];

    if (employeeId) includeCondition[0].where = { employeeId };

    const payments = await LoanPayment.findAll({
      where: whereCondition,
      include: includeCondition,
      order: [["paymentDate", "DESC"]],
    });

    res.status(200).json({ success: true, data: { payments } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get loans report with filters
// @route   GET /api/reports/loans
export const getLoansReport = async (req, res) => {
  try {
    const { status, startDate, endDate, employeeId } = req.query;
    const whereCondition = {};

    if (status) whereCondition.status = status;
    if (startDate && endDate)
      whereCondition.loanDate = { [Op.between]: [startDate, endDate] };
    if (employeeId) whereCondition.employeeId = employeeId;

    const loans = await Loan.findAll({
      where: whereCondition,
      include: [
        {
          model: Employee,
          as: "Employee",
          attributes: ["id", "fullName", "position"],
        },
        {
          model: LoanPayment,
          as: "LoanPayments",
          attributes: ["id", "amount"],
        },
      ],
      order: [["loanDate", "DESC"]],
    });

    const stats = loans.reduce(
      (acc, loan) => {
        acc.totalLoans++;
        acc.totalAmount += parseFloat(loan.amount || 0);
        acc.totalRemaining += parseFloat(loan.remainingAmount || 0);
        acc.totalPaid += (loan.LoanPayments || []).reduce(
          (sum, p) => sum + parseFloat(p.amount || 0),
          0,
        );
        if (loan.status === "Active") acc.activeLoans++;
        else acc.closedLoans++;
        return acc;
      },
      {
        totalLoans: 0,
        activeLoans: 0,
        closedLoans: 0,
        totalAmount: 0,
        totalPaid: 0,
        totalRemaining: 0,
      },
    );

    res.status(200).json({ success: true, data: { statistics: stats, loans } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get dashboard stats
// @route   GET /api/reports/dashboard
export const getDashboardStats = async (req, res) => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);

    const totalEmployees = await Employee.count();
    const activeLoans = await Loan.findAll({
      where: { status: "Active" },
      attributes: [
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        [
          sequelize.fn("SUM", sequelize.col("remainingAmount")),
          "totalRemaining",
        ],
      ],
    });

    const monthlyPayments = await LoanPayment.sum("amount", {
      where: { paymentDate: { [Op.gte]: startOfMonth } },
    });

    const monthlyLoans = await Loan.count({
      where: { loanDate: { [Op.gte]: startOfMonth } },
    });

    const topEmployees = await Wallet.findAll({
      attributes: ["employeeId", "remainingBalance"],
      include: [
        {
          model: Employee,
          as: "Employee",
          attributes: ["fullName", "position"],
        },
      ],
      order: [["remainingBalance", "DESC"]],
      limit: 5,
    });

    res.status(200).json({
      success: true,
      data: {
        totalEmployees,
        activeLoans: {
          count: parseInt(activeLoans[0]?.dataValues.count || 0),
          totalAmount: parseFloat(
            activeLoans[0]?.dataValues.totalRemaining || 0,
          ),
        },
        monthlyStats: {
          payments: parseFloat(monthlyPayments || 0),
          newLoans: monthlyLoans,
        },
        topEmployees,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
