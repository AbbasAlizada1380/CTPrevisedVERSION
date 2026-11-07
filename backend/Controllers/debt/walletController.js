import { Wallet, Employee } from "../../Models/debt/index.js";
// In walletController.js - Add missing import at the top
import sequelize from "../../dbconnection.js";
import { Op } from "sequelize"; // Add this too if using Op

// @desc    Get wallet by employee ID
// @route   GET /api/wallets/employee/:employeeId
// @access  Public
export const getWalletByEmployeeId = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const wallet = await Wallet.findOne({
      where: { employeeId },
      include: [
        {
          model: Employee,
          attributes: ["id", "fullName", "position"],
        },
      ],
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: "والت یافت نشد",
      });
    }

    res.status(200).json({
      success: true,
      data: wallet,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Get all wallets with employee details
// @route   GET /api/wallets
// @access  Public
export const getAllWallets = async (req, res) => {
  try {
    const wallets = await Wallet.findAll({
      include: [
        {
          model: Employee,
          attributes: ["id", "fullName", "position"],
        },
      ],
      order: [["remainingBalance", "DESC"]],
    });

    const summary = wallets.reduce(
      (acc, wallet) => {
        acc.totalLoans += parseFloat(wallet.totalLoans);
        acc.totalPaid += parseFloat(wallet.totalPaid);
        acc.totalRemaining += parseFloat(wallet.remainingBalance);
        return acc;
      },
      {
        totalLoans: 0,
        totalPaid: 0,
        totalRemaining: 0,
      },
    );

    res.status(200).json({
      success: true,
      data: {
        wallets,
        summary: {
          totalLoans: summary.totalLoans,
          totalPaid: summary.totalPaid,
          totalRemaining: summary.totalRemaining,
          employeesWithBalance: wallets.filter((w) => w.remainingBalance > 0)
            .length,
        },
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Reset wallet (admin only)
// @route   PUT /api/wallets/:id/reset
// @access  Private/Admin
export const resetWallet = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;

    const wallet = await Wallet.findByPk(id, {
      include: [
        {
          model: Employee,
          include: [Loan],
        },
      ],
      transaction,
    });

    if (!wallet) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: "والت یافت نشد",
      });
    }

    // Check if employee has active loans
    const hasActiveLoans = wallet.Employee.Loans.some(
      (loan) => loan.status === "Active",
    );

    if (hasActiveLoans) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: "امکان ریست والت هنگام وجود قرضه فعال وجود ندارد",
      });
    }

    // Reset wallet
    wallet.totalLoans = 0;
    wallet.totalPaid = 0;
    wallet.remainingBalance = 0;
    await wallet.save({ transaction });

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: "والت با موفقیت ریست شد",
      data: wallet,
    });
  } catch (error) {
    await transaction.rollback();
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};
