import { DataTypes } from "sequelize";
import sequelize from "../../dbconnection.js";

const Staff = sequelize.define(
  "Staff",
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "Staff member's full name",
    },
    fatherName: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "Father's name of the staff member",
    },
    NIC: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "National ID / NIC number",
    },
    salary: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
      comment: "weekly salary",
    },
    overTimePerHour: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
      comment: "Overtime pay per hour",
    },
    workingDaysPerWeek: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 7,
      },
      comment: "Number of working days per week",
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        fields: ["NIC"],
      },
    ],
  }
);

export default Staff;
