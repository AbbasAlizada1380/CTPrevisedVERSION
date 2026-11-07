import { DataTypes } from "sequelize";
import sequelize from "../dbconnection.js";

const Owner = sequelize.define(
  "owner",
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
      isActive: {
      type: DataTypes.BOOLEAN,
    },
  },
  {
    timestamps: true,
  }
);

export default Owner;
