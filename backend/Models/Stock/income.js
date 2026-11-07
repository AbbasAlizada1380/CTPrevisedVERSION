import { DataTypes } from "sequelize";
import sequelize from "../../dbconnection.js";

const Income = sequelize.define(
  "Income",
  {
    size: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.STRING,
    },
    price: {
      type: DataTypes.STRING,
    },
    money: {
      type: DataTypes.STRING,
    },
    spent: {
      type: DataTypes.STRING,
    },
    sellerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "Sellers", key: "id" },
    },
    // ✅ NEW: factorId field
    factorId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "Factors", // Assumes a 'Factors' table exists
        key: "id",
      },
      // Optionally, you can add onDelete: 'SET NULL' or 'CASCADE' based on your logic
    },
  },
  {
    timestamps: true,
    // ✅ NEW: Add an index on factorId
    indexes: [
      {
        fields: ["factorId"],
        // Optionally, you can name the index:
        // name: "income_factorId_index",
      },
    ],
  }
);

export default Income;