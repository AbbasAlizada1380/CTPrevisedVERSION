import Attendance from "../Models/Attendence.js";
import Staff from "../Models/staff/staff.js"
import { Op } from "sequelize";
const calculateAmounts = (attendance, dailySalary, overTimePerHour, workingDaysPerWeek) => {
  let attendanceDays = 0;
  let overtimeHours = 0;

  Object.values(attendance).forEach(day => {
    if (day.attendance) attendanceDays++;
    overtimeHours += Number(day.overtime || 0);
  });

  const salary = attendanceDays * (dailySalary / workingDaysPerWeek);
  const overtime = overtimeHours * overTimePerHour;
  const total = salary + overtime;

  return { salary, overtime, total };
};

export const createAttendance = async (req, res) => {
  try {
    const { staffId, attendance } = req.body;

    const staff = await Staff.findByPk(staffId);
    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    const { salary, overtime, total } = calculateAmounts(
      attendance,
      staff.salary,
      staff.overTimePerHour,
      staff.workingDaysPerWeek
    );

    const record = await Attendance.create({
      staffId,
      attendance,
      salary,
      overtime,
      total,
    });

    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const getAttendances = async (req, res) => {
  try {
    const data = await Attendance.findAll({
      include: {
        model: Staff,
        attributes: ["id", "name"],
      },
      order: [["id", "DESC"]],
    });

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const getAttendanceById = async (req, res) => {
  try {
    const record = await Attendance.findByPk(req.params.id, {
      include: Staff,
    });

    if (!record) {
      return res.status(404).json({ message: "Attendance not found" });
    }

    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const updateAttendance = async (req, res) => {
  try {
    const { attendance, receipt } = req.body; // <-- include receipt

    const record = await Attendance.findByPk(req.params.id);
    if (!record) {
      return res.status(404).json({ message: "Attendance not found" });
    }

    const staff = await Staff.findByPk(record.staffId);

    const { salary, overtime, total } = calculateAmounts(
      attendance,
      staff.salary,
      staff.overTimePerHour,
      staff.workingDaysPerWeek
    );

    // Update attendance, amounts, and receipt
    await record.update({
      attendance,
      salary,
      overtime,
      total,
      receipt: receipt !== undefined ? receipt : record.receipt

    });

    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const deleteAttendance = async (req, res) => {
  try {
    const record = await Attendance.findByPk(req.params.id);

    if (!record) {
      return res.status(404).json({ message: "Attendance not found" });
    }

    await record.destroy();
    res.json({ message: "Attendance deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const getAttendancesByDateRange = async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        message: "Both 'from' and 'to' dates are required",
      });
    }

    // Convert query strings to Date objects
    const fromDate = new Date(from);
    const toDate = new Date(to);

    // Set end date to end of day
    toDate.setHours(23, 59, 59, 999);

    const attendances = await Attendance.findAll({
      where: {
        createdAt: {
          [Op.between]: [fromDate, toDate],
        },
      },
      include: [
        {
          model: Staff,
          attributes: ["id", "name"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      message: "Attendances fetched successfully",
      count: attendances.length,
      data: attendances,
    });

  } catch (error) {
    console.error("Error fetching attendances by date:", error);

    res.status(500).json({
      message: "Error fetching attendances",
      error: error.message,
    });
  }
};