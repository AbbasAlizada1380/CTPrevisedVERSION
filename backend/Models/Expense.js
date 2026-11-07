import { DataTypes } from "sequelize";
import sequelize from "../dbconnection.js";

const Expense = sequelize.define(
  "Expense",
  {
    // Since 'for' is a reserved keyword in JavaScript, we'll use 'recipient' or 'purpose'
    purpose: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "What the Expense is for"
    },
    by: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "Who initiated the Expense"
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    calculated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    description: {
      type: DataTypes.TEXT
    },

  },
  {
    timestamps: true,
    indexes: [
      {
        fields: ['purpose']
      },
      {
        fields: ['by']
      },
    ]
  }
);

export default Expense;