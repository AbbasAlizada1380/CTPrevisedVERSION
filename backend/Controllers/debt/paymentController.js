import { LoanPayment, Loan, Employee, Wallet } from "../../Models/debt/index.js";
import sequelize from "../../dbconnection.js";
import { updateWalletAfterPayment } from "../../utils/walletUpdater.js";
import { Op } from "sequelize";
import moment from "moment";

export const makePayment = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { loanId, amount, paymentDate } = req.body;
    const loan = await Loan.findByPk(loanId, {
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
      return res
        .status(400)
        .json({ success: false, error: "قرضه بسته شده است" });
    }
    if (amount > parseFloat(loan.remainingAmount)) {
      await transaction.rollback();
      return res.status(400).json({ success: false, error: "مبلغ نامعتبر" });
    }

    const payment = await LoanPayment.create(
      { loanId, amount, paymentDate },
      { transaction },
    );

    const newRemainingAmount =
      parseFloat(loan.remainingAmount) - parseFloat(amount);
    loan.remainingAmount = newRemainingAmount;
    if (newRemainingAmount === 0) loan.status = "Closed";
    await loan.save({ transaction });

    const wallet = loan.Employee.Wallet;
    await updateWalletAfterPayment(wallet, amount, transaction);
    await transaction.commit();

    res
      .status(200)
      .json({
        success: true,
        message: newRemainingAmount === 0 ? "قرضه تسویه شد" : "پرداخت ثبت شد",
        data: { payment, loan, wallet },
      });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getLoanPayments = async (req, res) => {
  try {
    const { loanId } = req.params;
    const payments = await LoanPayment.findAll({
      where: { loanId },
      include: [
        {
          model: Loan,
          as: "Loan",
          attributes: ["id", "amount", "status"],
          include: [
            { model: Employee, as: "Employee", attributes: ["id", "fullName"] },
          ],
        },
      ],
      order: [["paymentDate", "DESC"]],
    });
    const totalPaid = payments.reduce(
      (sum, payment) => sum + parseFloat(payment.amount),
      0,
    );
    res
      .status(200)
      .json({
        success: true,
        data: {
          payments,
          summary: { totalPayments: payments.length, totalAmount: totalPaid },
        },
      });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await LoanPayment.findByPk(id, {
      include: [
        {
          model: Loan,
          as: "Loan",
          include: [
            { model: Employee, as: "Employee", attributes: ["id", "fullName"] },
          ],
        },
      ],
    });
    if (!payment)
      return res.status(404).json({ success: false, error: "یافت نشد" });
    res.status(200).json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updatePayment = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { amount, paymentDate } = req.body;
    const payment = await LoanPayment.findByPk(id, {
      include: [
        {
          model: Loan,
          as: "Loan",
          include: [
            {
              model: Employee,
              as: "Employee",
              include: [{ model: Wallet, as: "Wallet" }],
            },
          ],
        },
      ],
      transaction,
    });
    if (!payment) {
      await transaction.rollback();
      return res.status(404).json({ success: false, error: "یافت نشد" });
    }

    const loan = payment.Loan;
    const wallet = loan.Employee.Wallet;
    const oldAmount = parseFloat(payment.amount);
    const newAmount = parseFloat(amount);
    const amountDifference = newAmount - oldAmount;

    if (newAmount > parseFloat(loan.remainingAmount) + oldAmount) {
      await transaction.rollback();
      return res.status(400).json({ success: false, error: "مبلغ نامعتبر" });
    }

    payment.amount = newAmount;
    payment.paymentDate = paymentDate || payment.paymentDate;
    await payment.save({ transaction });

    loan.remainingAmount = parseFloat(loan.remainingAmount) - amountDifference;
    if (loan.remainingAmount === 0) loan.status = "Closed";
    else if (loan.remainingAmount > 0 && loan.status === "Closed")
      loan.status = "Active";
    await loan.save({ transaction });

    wallet.totalPaid = parseFloat(wallet.totalPaid) + amountDifference;
    wallet.remainingBalance =
      parseFloat(wallet.remainingBalance) - amountDifference;
    await wallet.save({ transaction });
    await transaction.commit();
    res.status(200).json({ success: true, message: "به‌روزرسانی شد" });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deletePayment = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const payment = await LoanPayment.findByPk(id, {
      include: [
        {
          model: Loan,
          as: "Loan",
          include: [
            {
              model: Employee,
              as: "Employee",
              include: [{ model: Wallet, as: "Wallet" }],
            },
          ],
        },
      ],
      transaction,
    });
    if (!payment) {
      await transaction.rollback();
      return res.status(404).json({ success: false, error: "یافت نشد" });
    }

    const loan = payment.Loan;
    const wallet = loan.Employee.Wallet;
    const paymentAmount = parseFloat(payment.amount);

    loan.remainingAmount = parseFloat(loan.remainingAmount) + paymentAmount;
    if (loan.status === "Closed") loan.status = "Active";
    await loan.save({ transaction });

    wallet.totalPaid = parseFloat(wallet.totalPaid) - paymentAmount;
    wallet.remainingBalance =
      parseFloat(wallet.remainingBalance) + paymentAmount;
    await wallet.save({ transaction });

    await payment.destroy({ transaction });
    await transaction.commit();
    res.status(200).json({ success: true, message: "حذف شد" });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getPaymentsByDateRange = async (req, res) => {
  try {
    const { from, to } = req.query;

    // Build date filter
    let whereClause = {};
    if (from || to) {
      const startDate = from ? moment(from).startOf("day").toDate() : null;
      const endDate = to ? moment(to).endOf("day").toDate() : null;

      if (startDate && endDate) {
        whereClause.paymentDate = { [Op.between]: [startDate, endDate] };
      } else if (startDate) {
        whereClause.paymentDate = { [Op.gte]: startDate };
      } else if (endDate) {
        whereClause.paymentDate = { [Op.lte]: endDate };
      }
    }

    // Fetch payments with associations
    const payments = await LoanPayment.findAll({
      where: whereClause,
      include: [
        {
          model: Loan,
          as: "Loan",
          include: [
            {
              model: Employee,
              as: "Employee",
              attributes: ["id", "fullName"],
            },
          ],
        },
      ],
      order: [["paymentDate", "DESC"]],
    });

    // Compute summary
    const totalPayments = payments.length;
    const totalAmount = payments.reduce(
      (sum, p) => sum + parseFloat(p.amount),
      0
    );

    res.status(200).json({
      success: true,
      data: {
        payments,
        summary: {
          totalPayments,
          totalAmount,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};