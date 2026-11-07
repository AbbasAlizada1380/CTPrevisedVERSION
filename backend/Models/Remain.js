import { DataTypes } from "sequelize";
import sequelize from "../dbconnection.js";
import Customer from "./Customers.js";

const Remain = sequelize.define(
  "remain",
  {
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Customer,
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },

    orderId: {
      type: DataTypes.JSON,
      defaultValue: [],
      get() {
        const raw = this.getDataValue("orderId");
        return Array.isArray(raw) ? raw : [];
      },
      set(value) {
        this.setDataValue(
          "orderId",
          Array.isArray(value) ? value : value ? [value] : []
        );
      },
    },

    remainOrders: {
      type: DataTypes.JSON,
      defaultValue: [],
      get() {
        const raw = this.getDataValue("remainOrders");
        return Array.isArray(raw) ? raw : [];
      },
      set(value) {
        this.setDataValue(
          "remainOrders",
          Array.isArray(value) ? value : value ? [value] : []
        );
      },
    },

    receiptOrders: {
      type: DataTypes.JSON,
      defaultValue: [],
      get() {
        const raw = this.getDataValue("receiptOrders");
        return Array.isArray(raw) ? raw : [];
      },
      set(value) {
        this.setDataValue(
          "receiptOrders",
          Array.isArray(value) ? value : value ? [value] : []
        );
      },
    },
  },
  {
    timestamps: true,
    indexes: [{ fields: ["customerId"] }],

    hooks: {
      beforeSave: (remain) => {
        ["orderId", "remainOrders", "receiptOrders"].forEach((field) => {
          if (remain.changed(field)) {
            const prev = remain.previous(field) || [];
            const next = remain.getDataValue(field) || [];
            remain.setDataValue(
              field,
              [...new Set([...prev, ...next])]
            );
          }
        });
      },
    },
  }
);

// Associations
Remain.belongsTo(Customer, {
  foreignKey: "customerId",
  as: "customer",
});

export default Remain;
