import { DataTypes } from "sequelize";
import sequelize from "../../dbconnection.js";
import Seller from "../Seller/Seller.js";

const Pay = sequelize.define(
  "Pay",
  {
    seller: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
  },
  {
    timestamps: true,
  }
);
export default Pay;