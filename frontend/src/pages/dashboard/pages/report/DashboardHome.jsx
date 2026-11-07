import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FaUsers,
  FaBuilding,
  FaCreditCard,
  FaHandHoldingUsd,
  FaMoneyBillWave,
  FaChartLine,
  FaWallet,
  FaFileInvoiceDollar
} from "react-icons/fa";
import CustomersRemainMoney from "../CustomerRemainMoney";
import ActiveLoansModal from "../../../../pages1/dashboard/pages/ActiveLoansModal"; // adjust path as needed

const BASE_URL = import.meta.env.VITE_BASE_URL;

const DashboardHome = () => {
  const [showRemainModal, setShowRemainModal] = useState(false);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loanSummary, setLoanSummary] = useState({
    totalRemainingAmount: 0,
    totalLoans: 0
  });
  const [loansLoading, setLoansLoading] = useState(true);

  useEffect(() => {
    fetchFinancialReport();
    fetchLoansData();
  }, []);

  const fetchFinancialReport = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/report`, {
        params: { reportType: "financial" }
      });

      if (res.data.success) {
        setData(res.data.data);
      } else {
        setError("خطا در دریافت گزارش مالی");
      }
    } catch (err) {
      setError("ارتباط با سرور برقرار نشد");
    } finally {
      setLoading(false);
    }
  };

  const fetchLoansData = async () => {
    try {
      setLoansLoading(true);
      const res = await axios.get(`${BASE_URL}/loans/active`);
      if (res.data.success && res.data.data.summary) {
        setLoanSummary({
          totalRemainingAmount: res.data.data.summary.totalRemainingAmount || 0,
          totalLoans: res.data.data.summary.totalLoans || 0
        });
      } else {
        console.error("Invalid loans response format");
      }
    } catch (err) {
      console.error("Failed to fetch loans:", err);
    } finally {
      setLoansLoading(false);
    }
  };

  const money = (val) =>
    new Intl.NumberFormat("en").format(Math.round(val || 0)) + " افغانی";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-b-2 border-cyan-600 rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">داشبورد مالی</h1>

      {/* Main Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Stat
          title="پول بالای مشتریان"
          value={money(data.totalMoneyOnCustomers)}
          icon={FaUsers}
          onClick={() => setShowRemainModal(true)}
        />
        <Stat
          title="دریافتی از مشتریان"
          value={money(data.totalReceiptFromCustomers)}
          icon={FaCreditCard}
        />
        <Stat
          title="پول برداشتی مالکین"
          value={money(data.totalMoneyOnOwners)}
          icon={FaBuilding}
        />
        <Stat
          title="مجموع مصارف"
          value={money(data.totalExpense)}
          icon={FaMoneyBillWave}
        />
        <Stat
          title="معاشات پرداخت‌شده"
          value={money(data.totalPaid)}
          icon={FaHandHoldingUsd}
        />
        <Stat
          title="معاش پرداخت‌نشده"
          value={money(data.totalUnpaidSalary)}
          icon={FaWallet}
        />
        <Stat
          title="تمام معاش"
          value={money(data.totalSalaryLiability)}
          icon={FaWallet}
        />
        <Stat
          title="سود خالص"
          value={money(data.netProfit)}
          icon={FaChartLine}
        />

        {/* Clickable Loan Cards */}
        <Stat
          title="مجموع قرض‌های پرداخت‌نشده کارمندان"
          value={loansLoading ? "..." : money(loanSummary.totalRemainingAmount)}
          icon={FaFileInvoiceDollar}
          onClick={() => setShowLoanModal(true)}
        />
        <Stat
          title="تعداد کارمندان دارای قرض فعال"
          value={loansLoading ? "..." : loanSummary.totalLoans}
          icon={FaUsers}
          onClick={() => setShowLoanModal(true)}
        />
      </div>

      {/* Modals */}
      {showRemainModal && (
        <CustomersRemainMoney onClose={() => setShowRemainModal(false)} />
      )}
      {showLoanModal && (
        <ActiveLoansModal onClose={() => setShowLoanModal(false)} />
      )}
    </div>
  );
};

const Stat = ({ title, value, icon: Icon, onClick }) => (
  <div
    onClick={onClick}
    className={`bg-white rounded-xl shadow p-5 border
      ${onClick ? "cursor-pointer hover:bg-gray-50 transition" : ""}`}
  >
    <div className="flex items-center justify-between mb-3">
      <Icon className="text-cyan-600 text-xl" />
      <span className="text-sm text-gray-600">{title}</span>
    </div>
    <div className="text-2xl font-bold text-gray-800">{value}</div>
  </div>
);

export default DashboardHome;