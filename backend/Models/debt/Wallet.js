import { DataTypes } from "sequelize";
import sequelize from "../../dbconnection.js";

const Wallet = sequelize.define("Wallet", {
  employeeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
  },
  totalLoans: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  totalPaid: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  remainingBalance: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
});

export default Wallet;
