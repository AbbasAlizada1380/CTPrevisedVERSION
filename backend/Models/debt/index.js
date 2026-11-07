import Employee from "./Employee.js";
import Wallet from "./Wallet.js";
import Loan from "./Loan.js";
import LoanPayment from "./LoanPayment.js";

// ==========================================
// 🔗 گره زدن جداول با حروف بزرگ (مطابق فرانت‌اند)
// ==========================================

Employee.hasOne(Wallet, {
  foreignKey: "employeeId",
  as: "Wallet",
  onDelete: "CASCADE",
});
Wallet.belongsTo(Employee, { foreignKey: "employeeId", as: "Employee" });

Employee.hasMany(Loan, {
  foreignKey: "employeeId",
  as: "Loans",
  onDelete: "CASCADE",
});
Loan.belongsTo(Employee, { foreignKey: "employeeId", as: "Employee" });

Loan.hasMany(LoanPayment, {
  foreignKey: "loanId",
  as: "LoanPayments",
  onDelete: "CASCADE",
});
LoanPayment.belongsTo(Loan, { foreignKey: "loanId", as: "Loan" });

export { Employee, Wallet, Loan, LoanPayment };
