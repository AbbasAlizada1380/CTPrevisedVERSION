import { DataTypes } from "sequelize";
import sequelize from "../../dbconnection.js";
import Seller from "./Seller.js";

const SellerAccount = sequelize.define(
  "SellerAccount",
  {
    sellerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },

    paid: {
      type: DataTypes.JSON,   // ✅ use JSON instead of ARRAY
      allowNull: false,
      defaultValue: [],
    },

    unpaid: {
      type: DataTypes.JSON,   // ✅ use JSON instead of ARRAY
      allowNull: false,
      defaultValue: [],
    },
    pays: {
      type: DataTypes.JSON,   // ✅ use JSON instead of ARRAY
      allowNull: true,
      defaultValue: [],
    },
    total: {
      type: DataTypes.JSON,   // ✅ use JSON instead of ARRAY
      allowNull: false,
      defaultValue: [],
    },
  },
  {
    timestamps: true,
  }
);

export default SellerAccount;