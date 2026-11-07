import { useSelector } from "react-redux";
import Dashboard from "./pages/dashboard";

import EmployeesPage from "../EmployeesPage";
import WalletPage from "../WalletPage";
import {
  CompanyReport,
  EmployeeReport,
  LoanReport,
  PaymentReport,
} from "./pages/reports";
import LoansPage from "../LoansPage";
const MainContent = ({ activeComponent }) => {
  const { currentUser } = useSelector((state) => state.user);

  const userRole = currentUser?.role;
  console.log(userRole);


  const renderContent = () => {
    // // ✅ Reception → دسترسی به همه صفحات سیستم قرضه
    // if (userRole === "reception") {
    //   // اگر کامپوننت فعال نباشد، داشبورد را نشان بده
    //   if (!activeComponent || activeComponent === "home") {
    //     return <Dashboard />;
    //   }
    // }

    // // 👑 Admin → دسترسی کامل
    // if (userRole === "admin") {
    //   if (!activeComponent || activeComponent === "home") {
    //     return <Dashboard />;
    //   }
    // }

    // 🎯 مسیریابی بر اساس کامپوننت فعال
    switch (activeComponent) {
      // ========== صفحات اصلی ==========
      case "dashboard":
        return <Dashboard />;

      case "employees":
        return <EmployeesPage />;

      case "wallet":
        return <WalletPage />;

      case "loans":
        return <LoansPage />;

      // ========== صفحات گزارشات ==========
      case "companyReport":
        return <CompanyReport />;

      case "employeeReport":
        return <EmployeeReport />;

      case "paymentReport":
        return <PaymentReport />;

      case "loanReport":
        return <LoanReport />;

      // ========== برای سازگاری با نسخه قبلی ==========
      case "report":
        return <CompanyReport />;

      case "StaffManager":
        return <EmployeesPage />;

      // ========== اگر هیچکدام مطابقت نداشت ==========
      default:
        // اگر activeComponent مقدار داشته باشد ولی در switch نباشد
        if (activeComponent) {
          console.warn(`Component not found: ${activeComponent}`);
        }
        // برگشت به داشبورد
        return <Dashboard />;
    }
  };

  // اطمینان از اینکه کاربر دسترسی لازم را دارد
  const hasAccess = () => {
    if (userRole === "admin" || userRole === "reception" || userRole == "FinancialManager") {
      return true;
    }
    return false;
  };

  if (!hasAccess()) {
    return (
      <div className="min-h-[90vh] bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">خطای دسترسی</h2>
          <p className="text-gray-600">شما مجوز دسترسی به این بخش را ندارید</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[90vh]  p-6" dir="rtl">
      {renderContent()}
    </div>
  );
};

export default MainContent;
