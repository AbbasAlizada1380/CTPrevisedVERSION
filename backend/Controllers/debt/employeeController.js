import { Employee, Wallet, Loan, LoanPayment } from "../../Models/debt/index.js";
import sequelize from "../../dbconnection.js";
import { Op } from "sequelize";

export const createEmployee = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { fullName, phone, position } = req.body;
    if (!fullName || !phone || !position) {
      await transaction.rollback();
      return res
        .status(400)
        .json({ success: false, error: "لطفاً تمام فیلدها را پر کنید" });
    }
    const employee = await Employee.create(
      { fullName, phone, position },
      { transaction },
    );
    const wallet = await Wallet.create(
      {
        employeeId: employee.id,
        totalLoans: 0,
        totalPaid: 0,
        remainingBalance: 0,
      },
      { transaction },
    );
    await transaction.commit();
    res
      .status(201)
      .json({ success: true, data: { ...employee.toJSON(), wallet } });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getEmployees = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const offset = (page - 1) * limit;

    let whereCondition = {};
    if (search && search.trim() !== "") {
      whereCondition = {
        [Op.or]: [
          { fullName: { [Op.like]: `%${search}%` } },
          { phone: { [Op.like]: `%${search}%` } },
          { position: { [Op.like]: `%${search}%` } },
        ],
      };
    }

    const { count, rows: employees } = await Employee.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: Wallet,
          as: "Wallet",
          attributes: ["totalLoans", "totalPaid", "remainingBalance"],
          required: false,
        },
      ],
      limit: limit,
      offset: offset,
      order: [["createdAt", "DESC"]],
      distinct: true,
    });

    res
      .status(200)
      .json({
        success: true,
        data: employees,
        pagination: {
          total: count,
          page,
          limit,
          pages: Math.ceil(count / limit),
        },
      });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.findAll({
      include: [
        {
          model: Wallet,
          as: "Wallet",
          attributes: ["totalLoans", "totalPaid", "remainingBalance"],
          required: false,
        },
      ],
      order: [["fullName", "ASC"]],
    });
    res.status(200).json({ success: true, data: employees });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findByPk(id, {
      include: [
        {
          model: Wallet,
          as: "Wallet",
          attributes: ["totalLoans", "totalPaid", "remainingBalance"],
          required: false,
        },
        {
          model: Loan,
          as: "Loans",
          required: false,
          include: [
            {
              model: LoanPayment,
              as: "LoanPayments",
              attributes: ["id", "amount", "paymentDate", "createdAt"],
              required: false,
            },
          ],
          order: [["createdAt", "ASC"]],
        },
      ],
    });

    if (!employee)
      return res.status(404).json({ success: false, error: "کارمند یافت نشد" });

    if (!employee.Wallet) {
      employee.dataValues.Wallet = {
        totalLoans: 0,
        totalPaid: 0,
        remainingBalance: 0,
        message: "کیف پول ایجاد نشده است",
      };
    }
    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, phone, position } = req.body;
    if (!fullName || !phone || !position)
      return res.status(400).json({ success: false, error: "فیلدها خالی است" });

    const employee = await Employee.findByPk(id);
    if (!employee)
      return res.status(404).json({ success: false, error: "کارمند یافت نشد" });
    await employee.update({ fullName, phone, position });

    const updatedEmployee = await Employee.findByPk(id, {
      include: [{ model: Wallet, as: "Wallet" }],
    });
    res.status(200).json({ success: true, data: updatedEmployee });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteEmployee = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const employee = await Employee.findByPk(id, { transaction });
    if (!employee) {
      await transaction.rollback();
      return res.status(404).json({ success: false, error: "یافت نشد" });
    }

    const activeLoan = await Loan.findOne({
      where: { employeeId: id, status: "Active" },
      transaction,
    });
    if (activeLoan) {
      await transaction.rollback();
      return res
        .status(400)
        .json({ success: false, error: "امکان حذف کارمند دارای قرضه نیست" });
    }

    await employee.destroy({ transaction });
    await transaction.commit();
    res.status(200).json({ success: true, message: "کارمند حذف شد" });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ success: false, error: error.message });
  }
};
