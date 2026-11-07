import Employee from "./Employee.js";
import Wallet from "./Wallet.js";
import Loan from "./Loan.js";
import LoanPayment from "./LoanPayment.js";

export const setupAssociations = () => {
  // Employee → Wallet
  Employee.hasOne(Wallet, { foreignKey: "employeeId", as: "wallet" });
  Wallet.belongsTo(Employee, { foreignKey: "employeeId", as: "employee" });

  // Employee → Loan
  Employee.hasMany(Loan, { foreignKey: "employeeId", as: "loans" });
  Loan.belongsTo(Employee, { foreignKey: "employeeId", as: "employee" });

  // Loan → LoanPayments
  Loan.hasMany(LoanPayment, { foreignKey: "loanId", as: "payments" });
  LoanPayment.belongsTo(Loan, { foreignKey: "loanId", as: "loan" });
};
