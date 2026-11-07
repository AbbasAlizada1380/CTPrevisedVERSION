import { Loan, Employee, Wallet, LoanPayment } from "../../Models/debt/index.js";
import sequelize from "../../dbconnection.js";
import { updateWalletAfterLoan } from "../../utils/walletUpdater.js";
import { Op } from "sequelize";
export const createLoan = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { employeeId, amount, loanDate, description } = req.body;
    const employee = await Employee.findByPk(employeeId, { transaction });
    if (!employee) {
      await transaction.rollback();
      return res.status(404).json({ success: false, error: "کارمند یافت نشد" });
    }

    const activeLoan = await Loan.findOne({
      where: { employeeId, status: "Active" },
      transaction,
    });
    if (activeLoan) {
      await transaction.rollback();
      return res
        .status(400)
        .json({ success: false, error: "کارمند دارای قرضه فعال است" });
    }

    const loan = await Loan.create(
      {
        employeeId,
        amount,
        remainingAmount: amount,
        loanDate,
        description,
        status: "Active",
      },
      { transaction },
    );
    const wallet = await Wallet.findOne({ where: { employeeId }, transaction });
    await updateWalletAfterLoan(wallet, amount, "create", transaction);
    await transaction.commit();

    const updatedWallet = await Wallet.findOne({ where: { employeeId } });
    res
      .status(201)
      .json({
        success: true,
        data: { ...loan.toJSON(), wallet: updatedWallet },
      });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getActiveLoans = async (req, res) => {
  try {
    const loans = await Loan.findAll({
      where: { status: "Active" },
      include: [
        {
          model: Employee,
          as: "Employee",
          attributes: ["id", "fullName", "phone", "position"],
          required: false,
        },
        {
          model: LoanPayment,
          as: "LoanPayments",
          attributes: ["id", "amount", "paymentDate"],
          limit: 5,
          order: [["paymentDate", "DESC"]],
          required: false,
        },
      ],
      order: [["loanDate", "DESC"]],
    });

    const validLoans = loans.filter((loan) => loan.Employee);
    const totalAmount = validLoans.reduce(
      (sum, loan) => sum + parseFloat(loan.remainingAmount || 0),
      0,
    );

    res
      .status(200)
      .json({
        success: true,
        data: {
          loans: validLoans,
          summary: {
            totalLoans: validLoans.length,
            totalRemainingAmount: totalAmount,
          },
        },
      });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getClosedLoans = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: loans } = await Loan.findAndCountAll({
      where: { status: "Closed" },
      include: [
        { model: Employee, as: "Employee", attributes: ["id", "fullName"] },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["updatedAt", "DESC"]],
    });

    res
      .status(200)
      .json({
        success: true,
        data: loans,
        pagination: {
          total: count,
          page: parseInt(page),
          pages: Math.ceil(count / limit),
        },
      });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getLoanById = async (req, res) => {
  try {
    const { id } = req.params;
    const loan = await Loan.findByPk(id, {
      include: [
        {
          model: Employee,
          as: "Employee",
          attributes: ["id", "fullName", "phone", "position"],
        },
        {
          model: LoanPayment,
          as: "LoanPayments",
          order: [["paymentDate", "DESC"]],
        },
      ],
    });
    if (!loan)
      return res.status(404).json({ success: false, error: "قرضه یافت نشد" });
    res.status(200).json({ success: true, data: loan });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const closeLoan = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const loan = await Loan.findByPk(id, {
      include: [
        {
          model: Employee,
          as: "Employee",
          include: [{ model: Wallet, as: "Wallet" }],
        },
      ],
      transaction,
    });
    if (!loan) {
      await transaction.rollback();
      return res.status(404).json({ success: false, error: "قرضه یافت نشد" });
    }
    if (loan.status === "Closed") {
      await transaction.rollback();
      return res.status(400).json({ success: false, error: "قبلاً بسته شده" });
    }

    loan.status = "Closed";
    loan.remainingAmount = 0;
    await loan.save({ transaction });

    const wallet = loan.Employee.Wallet;
    if (wallet) {
      wallet.remainingBalance =
        parseFloat(wallet.remainingBalance) - parseFloat(loan.remainingAmount);
      await wallet.save({ transaction });
    }
    await transaction.commit();
    res
      .status(200)
      .json({ success: true, message: "قرضه بسته شد", data: loan });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ success: false, error: error.message });
  }
};
export const getLoansByDateRange = async (req, res) => {
  try {
    const { startDate, endDate, page = 1, limit = 10 } = req.query;

    // Validate required parameters
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: "لطفاً بازه زمانی را مشخص کنید",
      });
    }

    // Parse and validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        error: "فرمت تاریخ نامعتبر است",
      });
    }
    if (start > end) {
      return res.status(400).json({
        success: false,
        error: "تاریخ شروع باید قبل از تاریخ پایان باشد",
      });
    }

    // Include the entire end day (23:59:59.999)
    end.setHours(23, 59, 59, 999);

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: loans } = await Loan.findAndCountAll({
      where: {
        createdAt: {
          [Op.between]: [start, end],
        },
      },
      include: [
        {
          model: Employee,
          as: "Employee",
          attributes: ["id", "fullName", "phone", "position"],
          required: false, // Still returns loans even if employee deleted? Keep as optional.
        },
        {
          model: LoanPayment,
          as: "LoanPayments",
          attributes: ["id", "amount", "paymentDate"],
          limit: 5,
          order: [["paymentDate", "DESC"]],
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: offset,
    });

    // Filter out loans where Employee is missing (if you want to hide orphan loans)
    const validLoans = loans.filter((loan) => loan.Employee);
    const totalRemaining = validLoans.reduce(
      (sum, loan) => sum + parseFloat(loan.remainingAmount || 0),
      0,
    );

    res.status(200).json({
      success: true,
      data: {
        loans: validLoans,
        summary: {
          totalLoans: validLoans.length,
          totalRemainingAmount: totalRemaining,
        },
        pagination: {
          total: count,
          page: parseInt(page),
          pages: Math.ceil(count / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};