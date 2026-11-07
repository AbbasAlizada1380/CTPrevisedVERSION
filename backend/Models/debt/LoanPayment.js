import { DataTypes } from "sequelize";
import sequelize from "../../dbconnection.js";

const LoanPayment = sequelize.define("LoanPayment", {
  loanId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0.01,
    },
  },
  paymentDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
});

export default LoanPayment;
