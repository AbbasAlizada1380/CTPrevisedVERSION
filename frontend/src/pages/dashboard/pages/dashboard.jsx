import React from "react";
import FinancialReports from "./report/FinancialReports"; // Adjust the import path as needed
import DashboardHome from "./report/DashboardHome";
import AnalyticsDashboard from "./report/AnalyticsDashboard";
import CompanyStock from "./CompanyStock";
import CombinedReport from "./report/CombinedReport"
import CustomerRemainReport from "./report/CustomerRemainReport";
import DatabaseSync from "./DatabaseSync";
const Dashboard = () => {
  return (
    <div className=" p-6 bg-gray-50 min-h-screen text-right" dir="rtl">
      {/* Main Dashboard Title */}
      <h1 className=" text-center text-2xl lg:text-3xl font-bold text-gray-800 mb-6">
        داشبورد  غرب سی تی پی
      </h1>

      {/* Render the FinancialReports component */}
      <div className="mt-6">
        <CustomerRemainReport/>
        <CombinedReport/>
        <DatabaseSync/>
        <DashboardHome />
        <CompanyStock/>
      </div>
    </div>
  );
};

export default Dashboard;
