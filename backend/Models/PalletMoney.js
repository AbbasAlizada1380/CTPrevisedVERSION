import { DataTypes } from "sequelize";
import sequelize from "../dbconnection.js";
import Owner from "./owners.js";

const PalletMoney = sequelize.define(
  "PalletMoney",
  { amount: {
      type: DataTypes.DECIMAL(12, 2), // good for money
      allowNull: false,
    },
    calculated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
  },
  {
    timestamps: true,
  }
);

export default PalletMoney