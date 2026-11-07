import { DataTypes } from "sequelize";
import sequelize from "../../dbconnection.js";

const Loan = sequelize.define("Loan", {
  employeeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0,
    },
  },
  remainingAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  loanDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  description: {
    type: DataTypes.TEXT,
  },
  status: {
    type: DataTypes.ENUM("Active", "Closed"),
    defaultValue: "Active",
  },
});

export default Loan;
