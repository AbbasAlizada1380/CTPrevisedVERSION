import { DataTypes } from "sequelize";
import sequelize from "../dbconnection.js";

const Customer = sequelize.define(
  "Customer",
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

    // ===== Price list (fixed sizes with prices) =====
    priceList: {
      type: DataTypes.JSON,
      defaultValue: [
        { size: "1030 × 820 mm", price: 450 },
        { size: "1030 × 770 mm", price: 400 },
        { size: "745 × 605 mm", price: 350 },
        { size: "724 × 615 mm", price: 170 },
        { size: "650 × 550 mm", price: 155 },
        { size: "645 × 510 mm", price: 145 },
        { size: "510 × 400 mm", price: 85 },
        { size: "450 × 370 mm", price: 85 },
      ],
      get() {
        const raw = this.getDataValue("priceList");
        if (!Array.isArray(raw)) return [];
        // Normalize each item to { size, price }
        return raw.map((item) => ({
          size: item?.size ?? "",
          price: Number(item?.price) || 0,
        }));
      },
      set(value) {
        if (!Array.isArray(value)) {
          this.setDataValue("priceList", []);
          return;
        }
        const normalized = value.map((item) => ({
          size: item?.size ?? "",
          price: Number(item?.price) || 0,
        }));
        this.setDataValue("priceList", normalized);
      },
    },
  },
  {
    timestamps: true,

    hooks: {
      beforeSave: (customer) => {
        // Ensure the priceList always contains unique sizes
        const list = customer.getDataValue("priceList") || [];
        const seen = new Set();
        const unique = [];

        list.forEach((item) => {
          if (item && item.size && !seen.has(item.size)) {
            seen.add(item.size);
            unique.push({
              size: item.size,
              price: Number(item.price) || 0,
            });
          }
        });

        customer.setDataValue("priceList", unique);
      },
    },
  }
);

export default Customer;