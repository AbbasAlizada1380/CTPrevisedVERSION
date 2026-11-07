import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllWallets,
  getEmployeeWallet,
  makePayment,
  getLoanPayments,
  formatMoney,
  getEmployeesWithActiveLoans,
} from "../pages/dashboard/services/EmployeesService";
import { toast } from "react-hot-toast";
import {
  FaWallet,
  FaMoneyBillWave,
  FaHistory,
  FaUser,
  FaPhone,
  FaBriefcase,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";

const WalletPage = () => {
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // 'all', 'active', 'payments'
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  const queryClient = useQueryClient();

  // Fetch all wallets
  const { data: walletsData, isLoading: walletsLoading } = useQuery({
    queryKey: ["wallets"],
    queryFn: getAllWallets,
  });

  // Fetch employees with active loans
  const { data: activeLoansEmployees, isLoading: activeLoansLoading } =
    useQuery({
      queryKey: ["activeLoansEmployees"],
      queryFn: getEmployeesWithActiveLoans,
    });

  // Fetch selected employee wallet details
  const { data: employeeWalletData, isLoading: employeeWalletLoading } =
    useQuery({
      queryKey: ["employeeWallet", selectedEmployee],
      queryFn: () => getEmployeeWallet(selectedEmployee),
      enabled: !!selectedEmployee,
    });

  // Fetch loan payments for selected loan
  const { data: loanPaymentsData } = useQuery({
    queryKey: ["loanPayments", selectedLoan],
    queryFn: () => getLoanPayments(selectedLoan),
    enabled: !!selectedLoan,
  });

  // Make payment mutation
  const paymentMutation = useMutation({
    mutationFn: makePayment,
    onSuccess: (data) => {
      toast.success(data.message || "پرداخت با موفقیت ثبت شد");
      setShowPaymentModal(false);
      setPaymentAmount("");
      setSelectedLoan(null);

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      queryClient.invalidateQueries({ queryKey: ["activeLoansEmployees"] });
      if (selectedEmployee) {
        queryClient.invalidateQueries({
          queryKey: ["employeeWallet", selectedEmployee],
        });
      }
      if (selectedLoan) {
        queryClient.invalidateQueries({
          queryKey: ["loanPayments", selectedLoan],
        });
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "خطا در ثبت پرداخت");
    },
  });

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    if (!selectedLoan || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error("لطفاً مبلغ معتبر وارد کنید");
      return;
    }

    paymentMutation.mutate({
      loanId: selectedLoan,
      amount: parseFloat(paymentAmount),
      paymentDate: paymentDate,
    });
  };

  const wallets = walletsData?.data?.wallets || [];
  const walletSummary = walletsData?.data?.summary || {};
  const employeeLoans = employeeWalletData?.data?.Loans || [];
  const loanPayments = loanPaymentsData?.data?.payments || [];

  if (walletsLoading || activeLoansLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6" dir="rtl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FaWallet className="text-blue-600" />
          مدیریت والت و پرداخت‌ها
        </h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">مجموع قرضه‌ها</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatMoney(walletSummary.totalLoans)} AFN
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FaWallet className="text-blue-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">مجموع پرداخت‌ها</p>
              <p className="text-2xl font-bold text-green-600">
                {formatMoney(walletSummary.totalPaid)} AFN
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <FaMoneyBillWave className="text-green-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">باقی‌مانده کل</p>
              <p className="text-2xl font-bold text-yellow-600">
                {formatMoney(walletSummary.totalRemaining)} AFN
              </p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <FaHistory className="text-yellow-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">کارمندان با قرضه</p>
              <p className="text-2xl font-bold text-purple-600">
                {walletSummary.employeesWithBalance || 0}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <FaUser className="text-purple-600 text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Employee Wallets List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="font-bold text-gray-800">لیست والت کارمندان</h2>
            </div>
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {wallets.map((wallet) => (
                <button
                  key={wallet.id}
                  onClick={() => setSelectedEmployee(wallet.employeeId)}
                  className={`w-full p-4 text-right hover:bg-gray-50 transition ${
                    selectedEmployee === wallet.employeeId ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-gray-900">
                        {wallet.Employee?.fullName}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <FaBriefcase className="text-xs" />
                        {wallet.Employee?.position}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <FaPhone className="text-xs" />
                        {wallet.Employee?.phone}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        wallet.remainingBalance > 0
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {wallet.remainingBalance > 0 ? "دارای قرضه" : "بدون قرضه"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                    <div>
                      <span className="text-gray-600">کل قرضه:</span>
                      <span className="mr-1 font-medium">
                        {formatMoney(wallet.totalLoans)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">باقی‌مانده:</span>
                      <span
                        className={`mr-1 font-medium ${
                          wallet.remainingBalance > 0
                            ? "text-yellow-600"
                            : "text-green-600"
                        }`}
                      >
                        {formatMoney(wallet.remainingBalance)}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Employee Details and Loans */}
        <div className="lg:col-span-2">
          {selectedEmployee ? (
            <div className="bg-white rounded-lg shadow">
              {/* Employee Info Header */}
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  جزئیات والت کارمند
                </h2>
                {employeeWalletData?.data && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">نام:</p>
                      <p className="font-medium">
                        {employeeWalletData.data.fullName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">وظیفه:</p>
                      <p className="font-medium">
                        {employeeWalletData.data.position}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">شماره تماس:</p>
                      <p className="font-medium">
                        {employeeWalletData.data.phone}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">معاش:</p>
                      <p className="font-medium">
                        {formatMoney(employeeWalletData.data.salary)} AFN
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Tabs */}
              <div className="border-b">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab("all")}
                    className={`px-4 py-2 font-medium text-sm ${
                      activeTab === "all"
                        ? "border-b-2 border-blue-600 text-blue-600"
                        : "text-gray-600"
                    }`}
                  >
                    همه قرضه‌ها
                  </button>
                  <button
                    onClick={() => setActiveTab("active")}
                    className={`px-4 py-2 font-medium text-sm ${
                      activeTab === "active"
                        ? "border-b-2 border-blue-600 text-blue-600"
                        : "text-gray-600"
                    }`}
                  >
                    قرضه‌های فعال
                  </button>
                  <button
                    onClick={() => setActiveTab("payments")}
                    className={`px-4 py-2 font-medium text-sm ${
                      activeTab === "payments"
                        ? "border-b-2 border-blue-600 text-blue-600"
                        : "text-gray-600"
                    }`}
                  >
                    تاریخچه پرداخت
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === "all" && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-gray-800 mb-4">
                      لیست قرضه‌ها
                    </h3>
                    {employeeLoans.length > 0 ? (
                      employeeLoans.map((loan) => (
                        <div
                          key={loan.id}
                          className="border rounded-lg p-4 hover:shadow-md transition"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${
                                  loan.status === "Active"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-green-100 text-green-800"
                                }`}
                              >
                                {loan.status === "Active"
                                  ? "فعال"
                                  : "تسویه شده"}
                              </span>
                              <p className="text-sm text-gray-600 mt-2">
                                تاریخ:{" "}
                                {new Date(loan.loanDate).toLocaleDateString(
                                  "fa-AF",
                                )}
                              </p>
                              {loan.description && (
                                <p className="text-sm text-gray-600 mt-1">
                                  توضیحات: {loan.description}
                                </p>
                              )}
                            </div>
                            <div className="text-left">
                              <p className="text-sm text-gray-600">
                                مقدار قرضه
                              </p>
                              <p className="text-lg font-bold text-blue-600">
                                {formatMoney(loan.amount)} AFN
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                باقی‌مانده:
                              </p>
                              <p
                                className={`font-medium ${
                                  loan.remainingAmount > 0
                                    ? "text-yellow-600"
                                    : "text-green-600"
                                }`}
                              >
                                {formatMoney(loan.remainingAmount)} AFN
                              </p>
                            </div>
                          </div>
                          {loan.status === "Active" && (
                            <button
                              onClick={() => {
                                setSelectedLoan(loan.id);
                                setShowPaymentModal(true);
                              }}
                              className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition flex items-center justify-center gap-2"
                            >
                              <FaMoneyBillWave />
                              ثبت پرداخت
                            </button>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-8">
                        هیچ قرضه‌ای یافت نشد
                      </p>
                    )}
                  </div>
                )}

                {activeTab === "active" && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-gray-800 mb-4">
                      قرضه‌های فعال
                    </h3>
                    {employeeLoans.filter((l) => l.status === "Active").length >
                    0 ? (
                      employeeLoans
                        .filter((loan) => loan.status === "Active")
                        .map((loan) => (
                          <div
                            key={loan.id}
                            className="border rounded-lg p-4 hover:shadow-md transition"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <p className="text-sm text-gray-600">
                                  تاریخ:{" "}
                                  {new Date(loan.loanDate).toLocaleDateString(
                                    "fa-AF",
                                  )}
                                </p>
                                {loan.description && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    توضیحات: {loan.description}
                                  </p>
                                )}
                              </div>
                              <div className="text-left">
                                <p className="text-sm text-gray-600">
                                  مقدار قرضه
                                </p>
                                <p className="text-lg font-bold text-blue-600">
                                  {formatMoney(loan.amount)} AFN
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                  باقی‌مانده:
                                </p>
                                <p className="font-medium text-yellow-600">
                                  {formatMoney(loan.remainingAmount)} AFN
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedLoan(loan.id);
                                setShowPaymentModal(true);
                              }}
                              className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition flex items-center justify-center gap-2"
                            >
                              <FaMoneyBillWave />
                              ثبت پرداخت
                            </button>
                          </div>
                        ))
                    ) : (
                      <p className="text-center text-gray-500 py-8">
                        هیچ قرضه فعالی وجود ندارد
                      </p>
                    )}
                  </div>
                )}

                {activeTab === "payments" && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-gray-800 mb-4">
                      تاریخچه پرداخت‌ها
                    </h3>
                    {selectedLoan ? (
                      <div>
                        <button
                          onClick={() => setSelectedLoan(null)}
                          className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-1"
                        >
                          ← برگشت به لیست قرضه‌ها
                        </button>
                        {loanPayments.length > 0 ? (
                          <div className="space-y-3">
                            {loanPayments.map((payment) => (
                              <div
                                key={payment.id}
                                className="border rounded-lg p-4"
                              >
                                <div className="flex justify-between items-center">
                                  <div>
                                    <p className="text-sm text-gray-600">
                                      تاریخ:{" "}
                                      {new Date(
                                        payment.paymentDate,
                                      ).toLocaleDateString("fa-AF")}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      زمان ثبت:{" "}
                                      {new Date(
                                        payment.createdAt,
                                      ).toLocaleString("fa-AF")}
                                    </p>
                                  </div>
                                  <div className="text-left">
                                    <p className="text-sm text-gray-600">
                                      مبلغ پرداخت
                                    </p>
                                    <p className="text-lg font-bold text-green-600">
                                      {formatMoney(payment.amount)} AFN
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center text-gray-500 py-8">
                            هیچ پرداختی برای این قرضه ثبت نشده است
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {employeeLoans.map((loan) => (
                          <button
                            key={loan.id}
                            onClick={() => setSelectedLoan(loan.id)}
                            className="w-full border rounded-lg p-4 text-right hover:bg-gray-50 transition"
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium">
                                  قرضه مورخ{" "}
                                  {new Date(loan.loanDate).toLocaleDateString(
                                    "fa-AF",
                                  )}
                                </p>
                                <p className="text-sm text-gray-600">
                                  مبلغ: {formatMoney(loan.amount)} AFN
                                </p>
                              </div>
                              <span className="text-blue-600 text-sm">
                                مشاهده پرداخت‌ها ←
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <FaWallet className="text-6xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                لطفاً یک کارمند را از لیست والت انتخاب کنید
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                ثبت پرداخت جدید
              </h2>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentAmount("");
                  setSelectedLoan(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  مبلغ پرداخت (افغانی) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  min="1"
                  step="100"
                  required
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="مثال: ۵۰۰۰"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  تاریخ پرداخت
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={paymentMutation.isLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition disabled:bg-blue-300"
                >
                  {paymentMutation.isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      در حال ثبت...
                    </span>
                  ) : (
                    "ثبت پرداخت"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPaymentAmount("");
                    setSelectedLoan(null);
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg transition"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletPage;
