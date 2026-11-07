// import Customer from "./pages/ServiceManger";
import Dashboard from "./pages/dashboard";
// import S_Transaction from "./pages/RentManager";
import Report from "./pages/reports";
import AddUser from "./pages/AddUser";
import Customers from "./pages/Customers";
import Stock from "./pages/Stock";
import ExpenseManager from "./pages/expense/ExpenseManages";
import StaffManager from "./pages/StaffManager";
import SalaryManagement from "./pages/SalaryManagement";
import Receipt from "./pages/Receipt";
import TakingMoneyManager from "./pages/TakingMoneyManager";
import CompanyStock from "./pages/CompanyStock";
import SellersList from "./pages/SellersList";
import OrdersWithTabs from "./pages/OrdersWithTabs";
const MainContent = ({ activeComponent }) => {
  const renderContent = () => {
    switch (activeComponent) {
      case "dashboard":
        return <Dashboard />;
      case "SalaryManagement":
        return <SalaryManagement />;
      case "Customers":
        return <Customers />;
      case "CompanyStock":
        return <CompanyStock />
      case "Money":
        return <TakingMoneyManager />;
      case "user managements":
        return <UserManagement />;
      case "report":
        return <Report />;
      case "Salaries":
        return <Salaries />;
      case "StaffManager":
        return <StaffManager />;
      case "Sellers":
        return <SellersList />;
      case "Stock":
        return <Stock />;
      case "ExpenseManager":
        return <ExpenseManager />;
      case "Orders":
        return <OrdersWithTabs />;
      case "Receipt":
        return <Receipt />;
      case "AddUser":
        return <AddUser />;

      default:
        return <Dashboard />;
    }
  };

  return <div className="min-h-[90vh]">{renderContent()}</div>;
};

export default MainContent;
