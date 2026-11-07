// In your Factor model definition file (e.g., Models/Finance/Factor.js)
import { DataTypes } from "sequelize";
import sequelize from "../../dbconnection.js";

const Factor = sequelize.define(
  "Factor",
  {
    factorNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    sellerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Sellers",
        key: "id",
      },
    },
    totalAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    paidAmount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    remainingAmount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM("paid", "partial", "unpaid"),
      defaultValue: "unpaid",
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    incomes: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
  },
  {
    timestamps: true,
  }
);

export default Factor;