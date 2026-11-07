import { DataTypes } from "sequelize";
import sequelize from "../dbconnection.js";
import Staff from "./staff/staff.js";

const Attendance = sequelize.define(
  "Attendance",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    staffId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Staff,
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },

    attendance: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: `
      {
        Saturday:  { attendance: true, overtime: 0 },
        Sunday:    { attendance: true, overtime: 0 },
        Monday:    { attendance: true, overtime: 0 },
        Tuesday:   { attendance: true, overtime: 0 },
        Wednesday: { attendance: true, overtime: 0 },
        Thursday:  { attendance: true, overtime: 0 }
      }
      `,
    },

    salary: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
      comment: "Calculated based on attendance days",
    },

    overtime: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
      comment: "Calculated based on total overtime hours * overtimePerHour",
    },

    total: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
      comment: "salary + overtime",
    },
    receipt: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    calculated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "attendance",
  }
);

/// Relations
Staff.hasMany(Attendance, { foreignKey: "staffId" });
Attendance.belongsTo(Staff, { foreignKey: "staffId" });

export default Attendance;
