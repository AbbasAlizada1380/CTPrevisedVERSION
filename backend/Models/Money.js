import { DataTypes } from "sequelize";
import sequelize from "../dbconnection.js";
import Owner from "./owners.js";

const Money = sequelize.define(
  "money",
  {
    ownerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Owner,
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },

    amount: {
      type: DataTypes.DECIMAL(12, 2), // good for money
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    calculated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
  },
  {
    timestamps: true,
  }
);

// Associations
Money.belongsTo(Owner, {
  foreignKey: "ownerId",
  as: "owner",
});

Owner.hasMany(Money, {
  foreignKey: "ownerId",
  as: "transactions",
});

export default Money;
