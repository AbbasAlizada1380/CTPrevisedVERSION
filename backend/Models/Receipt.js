import { DataTypes } from "sequelize";
import sequelize from "../dbconnection.js";
import Customer from "./Customers.js";

const Receipt = sequelize.define(
  "receipt",
  {
    customer: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Customer,
        key: 'id' // or whatever your Customer primary key is
      }
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    calculated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        fields: ['customer']
      },
    ]
  }
);

// Define associations
Receipt.belongsTo(Customer, { foreignKey: 'customer', targetKey: 'id' });
Customer.hasMany(Receipt, { foreignKey: 'customer', sourceKey: 'id' });

export default Receipt;