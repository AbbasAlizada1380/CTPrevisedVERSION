import { DataTypes } from "sequelize";
import sequelize from "../dbconnection.js";
import Customer from "./Customers.js";

const OrderItem = sequelize.define(
  "OrderItem",
  {
    size: {
      type: DataTypes.STRING,
    },
    qnty: {
      type: DataTypes.INTEGER,
      validate: {
        min: 1,
      },
    },
    customerName: {
      type: DataTypes.STRING,
    },
    fileName: {
      type: DataTypes.STRING,
    },
    invoiceNumber: {
      type: DataTypes.STRING,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      validate: {
        min: 0,
      },
    },
    money: {
      type: DataTypes.DECIMAL(10, 2),
      validate: {
        min: 0,
      },
    },
    receipt: {
      type: DataTypes.DECIMAL(10, 2),
      validate: {
        min: 0,
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    approved: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        name: "idx_order_items_created_at",
        fields: ["createdAt"],
      },
      {
        name: "idx_order_items_created_at_size",
        fields: ["createdAt", "size"],
      },
    ],

  }
);

// ---- Associations ----
OrderItem.associate = (models) => {
  OrderItem.belongsTo(models.Customer, {
    foreignKey: "customerId",
    as: "customer",
  });

  OrderItem.belongsTo(models.User, {
    foreignKey: "userId",
    as: "user",
  });
};

export default OrderItem;