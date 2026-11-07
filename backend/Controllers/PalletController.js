import PalletMoney from "../Models/PalletMoney.js";
import Outgoing from "../Models/Stock/outgoing.js";
import sequelize from "../dbconnection.js";

/* ===========================
   Create Pallet Money + Auto Pay Outgoing (FIFO)
=========================== */
export const createPalletMoney = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    let { amount, calculated } = req.body;

    if (amount === undefined || amount === null || amount <= 0) {
      await transaction.rollback();
      return res.status(400).json({
        message: "Valid amount is required",
      });
    }

    let remainingAmount = parseFloat(amount);

    // 1️⃣ Create PalletMoney record
    const palletMoney = await PalletMoney.create(
      {
        amount,
        calculated: calculated ?? false,
      },
      { transaction }
    );

    // 2️⃣ Get unpaid outgoing records (FIFO)
    const outgoings = await Outgoing.findAll({
      where: sequelize.literal("money > IFNULL(receipt, 0)"),
      order: [["createdAt", "ASC"]],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    const payments = [];

    // 3️⃣ Pay FIFO
    for (const outgoing of outgoings) {
      if (remainingAmount <= 0) break;

      const totalMoney = parseFloat(outgoing.money);
      const paidMoney = parseFloat(outgoing.receipt || 0);
      const remainingOutgoing = totalMoney - paidMoney;

      const payAmount = Math.min(remainingAmount, remainingOutgoing);

      await outgoing.update(
        {
          receipt: (paidMoney + payAmount).toFixed(2),
        },
        { transaction }
      );

      remainingAmount -= payAmount;

      payments.push({
        outgoingId: outgoing.id,
        paid: payAmount.toFixed(2),
        remainingOutgoing: (remainingOutgoing - payAmount).toFixed(2),
      });
    }

    await transaction.commit();

    res.status(201).json({
      message: "Pallet money created and applied successfully",
      palletMoney,
      summary: {
        initialAmount: amount,
        remainingAmount: remainingAmount.toFixed(2),
        paidOutgoings: payments.length,
      },
      payments,
    });
  } catch (error) {
    await transaction.rollback();
    console.error(error);

    res.status(500).json({
      message: "Error creating pallet money and settling outgoings",
      error: error.message,
    });
  }
};


/* ===========================
   Get All Pallet Money Records
=========================== */
export const getAllPalletMoney = async (req, res) => {
  try {
    const records = await PalletMoney.findAll({
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json(records);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching pallet money records",
      error: error.message,
    });
  }
};

/* ===========================
   Get Single Pallet Money
=========================== */
export const getPalletMoneyById = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await PalletMoney.findByPk(id);

    if (!record) {
      return res.status(404).json({
        message: "Pallet money record not found",
      });
    }

    res.status(200).json(record);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching pallet money",
      error: error.message,
    });
  }
};

/* ===========================
   Update Pallet Money
=========================== */
export const updatePalletMoney = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, calculated } = req.body;

    const record = await PalletMoney.findByPk(id);

    if (!record) {
      return res.status(404).json({
        message: "Pallet money record not found",
      });
    }

    await record.update({
      amount: amount ?? record.amount,
      calculated: calculated ?? record.calculated,
    });

    res.status(200).json({
      message: "Pallet money updated successfully",
      data: record,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error updating pallet money",
      error: error.message,
    });
  }
};

/* ===========================
   Delete Pallet Money
=========================== */
export const deletePalletMoney = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await PalletMoney.findByPk(id);

    if (!record) {
      return res.status(404).json({
        message: "Pallet money record not found",
      });
    }

    await record.destroy();

    res.status(200).json({
      message: "Pallet money deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error deleting pallet money",
      error: error.message,
    });
  }
};
