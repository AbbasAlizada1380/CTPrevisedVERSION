import Staff from "../Models/staff/staff.js";

/* =========================
   CREATE STAFF
========================= */
export const createStaff = async (req, res) => {
  try {
    const {
      name,
      fatherName,
      NIC,
      salary,
      overTimePerHour,
      workingDaysPerWeek,
    } = req.body;

    if (
      !name ||
      !fatherName ||
      !NIC ||
      salary === undefined ||
      overTimePerHour === undefined ||
      workingDaysPerWeek === undefined
    ) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const staff = await Staff.create({
      name,
      fatherName,
      NIC,
      salary,
      overTimePerHour,
      workingDaysPerWeek,
    });

    res.status(201).json(staff);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error creating staff",
      error: error.message,
    });
  }
};

/* =========================
   GET ALL STAFF (PAGINATION)
========================= */
export const getStaffs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await Staff.findAndCountAll({
      limit,
      offset,
      order: [["id", "DESC"]],
    });

    res.json({
      staffs: rows,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching staff",
      error: error.message,
    });
  }
};

/* =========================
   GET STAFF BY ID
========================= */
export const getStaffById = async (req, res) => {
  try {
    const staff = await Staff.findByPk(req.params.id);

    if (!staff) {
      return res.status(404).json({
        message: "Staff not found",
      });
    }

    res.json(staff);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching staff",
      error: error.message,
    });
  }
};

/* =========================
   UPDATE STAFF
========================= */
export const updateStaff = async (req, res) => {
  try {
    const staff = await Staff.findByPk(req.params.id);

    if (!staff) {
      return res.status(404).json({
        message: "Staff not found",
      });
    }

    await staff.update(req.body);

    res.json({
      message: "Staff updated successfully",
      staff,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error updating staff",
      error: error.message,
    });
  }
};

/* =========================
   DELETE STAFF
========================= */
export const deleteStaff = async (req, res) => {
  try {
    const staff = await Staff.findByPk(req.params.id);

    if (!staff) {
      return res.status(404).json({
        message: "Staff not found",
      });
    }

    await staff.destroy();

    res.json({
      message: "Staff deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error deleting staff",
      error: error.message,
    });
  }
};
