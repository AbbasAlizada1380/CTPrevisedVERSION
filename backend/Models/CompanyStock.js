import { DataTypes } from "sequelize";
import sequelize from "../dbconnection.js";

const CompanyStock = sequelize.define(
  "CompanyStock",
  {
    size: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.STRING,
    },
    money: {
      type: DataTypes.INTEGER,
    }
  },
  {
    timestamps: true,
  }
);

export default CompanyStock;
;
