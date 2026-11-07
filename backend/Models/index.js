import sequelize from '../dbconnection.js';
import Seller from './Seller/Seller.js';
import Income from './Stock/Income.js';
import SellerAccount from './Seller/SellerAccount.js';
import Pay from './Finance/Pay.js';
import Factor from './Finance/Factor.js';
import User from './user.js';
import Exist from './Stock/exist.js';
import Customer from './Customers.js';
import OrderItem from './OrderItems.js';   // ✅ new import

const models = {
  Seller,
  SellerAccount,
  Factor,
  Income,
  Exist,
  Pay,
  User,          // ✅ add
  Customer,      // ✅ add (if you want to centralize)
  OrderItem,     // ✅ add
};

// ========== INCOME ASSOCIATION ==========
Income.associate = (models) => {
  Income.belongsTo(models.Seller, { foreignKey: "sellerId", as: "seller" });
};

// ========== SELLER ASSOCIATION ==========
Seller.associate = (models) => {
  Seller.hasMany(models.Income, { foreignKey: "sellerId", as: "incomes" });
  Seller.hasOne(models.SellerAccount, { foreignKey: "sellerId", as: "account" });
  Seller.hasMany(models.Pay, { foreignKey: "seller", as: "payments" });
  Seller.hasMany(models.Factor, { foreignKey: "sellerId", as: "factors" });
};

// ========== SELLER ACCOUNT ASSOCIATION ==========
SellerAccount.associate = (models) => {
  SellerAccount.belongsTo(models.Seller, { foreignKey: "sellerId", as: "seller" });
};

// ========== PAY ASSOCIATION ==========
Pay.associate = (models) => {
  Pay.belongsTo(models.Seller, { foreignKey: "seller", as: "sellerInfo" });
};

// ========== FACTOR ASSOCIATION ==========
Factor.associate = (models) => {
  Factor.belongsTo(models.Seller, { foreignKey: "sellerId", as: "seller" });
};

// ========== USER ASSOCIATION ==========
User.associate = (models) => {
  User.hasMany(models.OrderItem, { foreignKey: "userId", as: "orderItems" });
};

// ========== CUSTOMER ASSOCIATION ==========
Customer.associate = (models) => {
  Customer.hasMany(models.OrderItem, { foreignKey: "customerId", as: "orderItems" });
};

// Apply all associations
Object.keys(models).forEach(modelName => {
  if (models[modelName] && models[modelName].associate) {
    models[modelName].associate(models);
  }
});

export {
  sequelize,
  Seller,
  SellerAccount,
  Factor,
  Income,
  Exist as StockExist,
  Exist,
  Pay,
  User,
  Customer,
  OrderItem,      // ✅ export it
};