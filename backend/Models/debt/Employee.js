import { DataTypes } from "sequelize";
import sequelize from "../../dbconnection.js";

const Employee = sequelize.define("Employee", {
  fullName: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      is: /^[0-9+\-\s]+$/,
    },
  },
  position: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
});

export default Employee;
