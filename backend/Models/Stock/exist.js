import { DataTypes } from "sequelize";
import sequelize from "../../dbconnection.js";

const Exist = sequelize.define(
  "Exist",
  {
    size: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.STRING,
    }
  },
  {
    timestamps: true,
  }
);

export default Exist;
