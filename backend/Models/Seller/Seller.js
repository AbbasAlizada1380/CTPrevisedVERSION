import { DataTypes } from "sequelize";
import sequelize from "../../dbconnection.js";

const Seller = sequelize.define(
  "Seller",
  {
    fullname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phoneNumber: {
      type: DataTypes.STRING,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
    },
  },
  {
    timestamps: true,
  }
);

export default Seller;
