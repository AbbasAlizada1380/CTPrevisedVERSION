import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getActiveLoans,
  getClosedLoans,
  createLoan,
  makePayment,
  getLoanPayments,
  getAllEmployeesSafe,
  formatMoney,
} from "../pages/dashboard/services/EmployeesService";
import { toast } from "react-hot-toast";
import {
  FaMoneyBillWave,
  FaPlus,
  FaHistory,
  FaCheckCircle,
  FaTimesCircle,
  FaUser,
  FaCalendarAlt,
  FaFileInvoice,
  FaWallet,
  FaSearch,
  FaFilter,
  FaPrint,
} from "react-icons/fa";
import { GiTakeMyMoney } from "react-icons/gi";
import { MdPayment, MdClose } from "react-icons/md";
import AnimatedModal from "../components/common/AnimatedModal";
import SearchableEmployeeSelect from "../components/SearchableEmployeeSelect";
import LoanPrintReceipt from "../components/LoanPrintReceipt";

const LoansPage = () => {
  const [activeTab, setActiveTab] = useState("active"); // 'active', 'closed', 'create'
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  // Add these state variables after your existing useState declarations
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedLoanForPrint, setSelectedLoanForPrint] = useState(null);

  // Add this function to handle print
  const handlePrintLoan = (loan) => {
    setSelectedLoanForPrint(loan);
    setShowPrintModal(true);
  };

  // Add this to get payments for the selected loan
  const getLoanPaymentsForPrint = (loanId) => {
    const loan = activeLoans.find((l) => l.id === loanId);
    return loan?.LoanPayments || [];
  };

  // Add this to get employee details for the selected loan
  const getEmployeeForPrint = (loan) => {
    return loan?.Employee || null;
  };

  // Form states
  const [loanForm, setLoanForm] = useState({
    employeeId: "",
    amount: "",
    loanDate: new Date().toISOString().split("T")[0],
    description: "",
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentDate: new Date().toISOString().split("T")[0],
  });

  const queryClient = useQueryClient();

  // Fetch active loans
  const { data: activeLoansData, isLoading: activeLoading } = useQuery({
    queryKey: ["activeLoans"],
    queryFn: getActiveLoans,
  });

  // Fetch closed loans
  const { data: closedLoansData, isLoading: closedLoading } = useQuery({
    queryKey: ["closedLoans"],
    queryFn: () => getClosedLoans({ page: 1, limit: 50 }),
  });

  // Fetch all employees for dropdown
  const { data: employees } = useQuery({
    queryKey: ["allEmployees"],
    queryFn: getAllEmployeesSafe,
  });

  // Fetch loan payments when a loan is selected
  const { data: paymentsData } = useQuery({
    queryKey: ["loanPayments", selectedLoan],
    queryFn: () => getLoanPayments(selectedLoan),
    enabled: !!selectedLoan,
  });

  // Create loan mutation
  const createLoanMutation = useMutation({
    mutationFn: createLoan,
    onSuccess: (data) => {
      toast.success("قرضه با موفقیت ثبت شد");
      setShowLoanModal(false);
      resetLoanForm();
      queryClient.invalidateQueries({ queryKey: ["activeLoans"] });
      queryClient.invalidateQueries({ queryKey: ["closedLoans"] });
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "خطا در ثبت قرضه");
    },
  });

  // Make payment mutation
  const paymentMutation = useMutation({
    mutationFn: makePayment,
    onSuccess: (data) => {
      toast.success(data.message || "پرداخت با موفقیت ثبت شد");
      setShowPaymentModal(false);
      resetPaymentForm();
      queryClient.invalidateQueries({ queryKey: ["activeLoans"] });
      queryClient.invalidateQueries({
        queryKey: ["loanPayments", selectedLoan],
      });
      queryClient.invalidateQueries({ queryKey: ["wallets"] });

      if (data.data?.loan?.status === "Closed") {
        queryClient.invalidateQueries({ queryKey: ["closedLoans"] });
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "خطا در ثبت پرداخت");
    },
  });

  const resetLoanForm = () => {
    setLoanForm({
      employeeId: "",
      amount: "",
      loanDate: new Date().toISOString().split("T")[0],
      description: "",
    });
  };

  const resetPaymentForm = () => {
    setPaymentForm({
      amount: "",
      paymentDate: new Date().toISOString().split("T")[0],
    });
  };

  const handleLoanSubmit = (e) => {
    e.preventDefault();
    if (!loanForm.employeeId || !loanForm.amount || !loanForm.loanDate) {
      toast.error("لطفاً تمام فیلدهای ضروری را پر کنید");
      return;
    }

    createLoanMutation.mutate({
      employeeId: parseInt(loanForm.employeeId),
      amount: parseFloat(loanForm.amount),
      loanDate: loanForm.loanDate,
      description: loanForm.description,
    });
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    if (!selectedLoan || !paymentForm.amount) {
      toast.error("لطفاً مبلغ را وارد کنید");
      return;
    }

    paymentMutation.mutate({
      loanId: selectedLoan,
      amount: parseFloat(paymentForm.amount),
      paymentDate: paymentForm.paymentDate,
    });
  };

  const handleSelectLoanForPayment = (loanId) => {
    setSelectedLoan(loanId);
    setShowPaymentModal(true);
  };

  // Filter loans based on search and status
  const filterLoans = (loans) => {
    if (!loans) return [];

    return loans.filter((loan) => {
      const matchesSearch =
        loan.Employee?.fullName
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        loan.amount?.toString().includes(searchTerm);

      if (filterStatus === "all") return matchesSearch;
      if (filterStatus === "high")
        return matchesSearch && loan.remainingAmount > 10000;
      if (filterStatus === "low")
        return matchesSearch && loan.remainingAmount <= 10000;

      return matchesSearch;
    });
  };

  const activeLoans = activeLoansData?.data?.loans || [];
  const closedLoans = closedLoansData?.data || [];
  const filteredActiveLoans = filterLoans(activeLoans);
  const filteredClosedLoans = filterLoans(closedLoans);
  const selectedLoanPayments = paymentsData?.data?.payments || [];

  if (activeLoading || closedLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className=" p-5" dir="rtl">
      {/* Header */}
      <div className="flex justify-between mb-6 items-center">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <GiTakeMyMoney className="text-teal-700" />
          مدیریت قرضه‌ها
        </h1>
        <button
          onClick={() => setShowLoanModal(true)}
          className="bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-md flex items-center gap-2 transition"
        >
          <FaPlus />
          <span>قرضه جدید</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Active Loans */}
        <div className="bg-gray-200 rounded-md shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">قرضه‌های فعال</p>
              <p className="text-xl font-bold text-teal-700">
                {activeLoansData?.data?.summary?.totalLoans || 0}
              </p>
            </div>
            <div className="bg-white p-3 rounded-md">
              <FaMoneyBillWave className="text-teal-700 text-xl" />
            </div>
          </div>
        </div>

        {/* Remaining Amount */}
        <div className="bg-gray-200 rounded-md shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">مجموع باقی‌مانده</p>
              <p className=" font-bold text-teal-700">
                {formatMoney(
                  activeLoansData?.data?.summary?.totalRemainingAmount || 0,
                )}{" "}
                اف
              </p>
            </div>
            <div className="bg-white p-3 rounded-md">
              <FaWallet className="text-teal-700 text-xl" />
            </div>
          </div>
        </div>

        {/* Closed Loans */}
        <div className="bg-gray-200 rounded-md shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">قرضه‌های تسویه شده</p>
              <p className="text-xl font-bold text-teal-700">
                {closedLoans.length}
              </p>
            </div>
            <div className="bg-white p-3 rounded-md">
              <FaCheckCircle className="text-teal-700 text-xl" />
            </div>
          </div>
        </div>

        {/* Employees With Loans */}
        <div className="bg-gray-200 rounded-md shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">کارمندان دارای قرضه</p>
              <p className="text-xl font-bold text-teal-700">
                {new Set(activeLoans.map((l) => l.employeeId)).size}
              </p>
            </div>
            <div className="bg-white p-3 rounded-md">
              <FaUser className="text-teal-700 text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-md mt-6 shadow">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab("active")}
              className={`px-6 py-3 font-medium text-sm  cursor-pointer flex items-center gap-2 ${
                activeTab === "active"
                  ? "border-b-2 border-teal-600 text-teal-700"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <FaMoneyBillWave />
              قرضه‌های فعال
            </button>
            <button
              onClick={() => setActiveTab("closed")}
              className={`px-6 py-3 font-medium text-sm flex cursor-pointer items-center gap-2 ${
                activeTab === "closed"
                  ? "border-b-2 border-teal-600 text-teal-700"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <FaCheckCircle />
              قرضه‌های تسویه شده
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-6 py-3 font-medium text-sm flex cursor-pointer items-center gap-2 ${
                activeTab === "history"
                  ? "border-b-2 border-teal-600 text-teal-700"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <FaHistory />
              تاریخچه پرداخت‌ها
            </button>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="جستجو بر اساس نام کارمند یا مبلغ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 bg-gray-200 border-gray-300 rounded-md focus:ring-1 focus:ring-teal-700 focus:border-transparent focus:outline-none"
              />
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Active Loans Tab */}
          {activeTab === "active" && (
            <div className="space-y-4">
              {filteredActiveLoans.length > 0 ? (
                filteredActiveLoans.map((loan) => (
                  <div
                    key={loan.id}
                    className="border border-gray-200 rounded-md p-4 hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="bg-teal-700 p-2 rounded-full">
                            <FaUser className="text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-700">
                              {loan.Employee?.fullName}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {loan.Employee?.position}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2  md:grid-cols-6 gap-4 mt-3">
                          <div>
                            <p className="text-sm text-gray-500">مبلغ قرضه</p>
                            <p className="font-bold text-teal-700">
                              {formatMoney(loan.amount)} AFN
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">باقی‌مانده</p>
                            <p className="font-bold text-red-600">
                              {formatMoney(loan.remainingAmount)} AFN
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">تاریخ قرضه</p>
                            <p className="text-sm">
                              {new Date(loan.loanDate).toLocaleDateString(
                                "fa-AF",
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">
                              فیصدی پرداخت
                            </p>
                            <p className="text-sm font-medium">
                              {(
                                ((loan.amount - loan.remainingAmount) /
                                  loan.amount) *
                                100
                              ).toFixed(1)}
                              %
                            </p>
                          </div>
                          <div className="flex gap-2 col-span-2 justify-end">
                            <button
                              onClick={() =>
                                handleSelectLoanForPayment(loan.id)
                              }
                              className="bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-md text-xs flex items-center gap-1"
                            >
                              <MdPayment />
                              پرداخت
                            </button>
                            <button
                              onClick={() => setSelectedLoan(loan.id)}
                              className="bg-sky-700 hover:bg-sky-800 text-white px-4 py-2 rounded-md text-xs flex items-center gap-1"
                            >
                              <FaHistory />
                              تاریخچه
                            </button>
                            <button
                              onClick={() => handlePrintLoan(loan)}
                              className="bg-purple-700 hover:bg-purple-800 text-white px-2 py-2 rounded-md text-xs flex items-center gap-1"
                              title="چاپ گزارش"
                            >
                              <FaPrint />
                              چاپ
                            </button>
                          </div>
                        </div>

                        {loan.description && (
                          <p className="text-sm text-gray-600 mt-2">
                            <span className="font-medium">توضیحات:</span>{" "}
                            {loan.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Show payment history if this loan is selected */}
                    {selectedLoan === loan.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-medium flex items-center gap-2">
                            <FaHistory className="text-teal-600" />
                            تاریخچه پرداخت‌ها
                          </h4>

                          {/* Close history */}
                          <button
                            onClick={() => setSelectedLoan(null)}
                            className="text-gray-500 hover:text-red-500 text-2xl font-bold"
                          >
                            ×
                          </button>
                        </div>
                        {selectedLoanPayments.length > 0 ? (
                          <div className="space-y-2">
                            {selectedLoanPayments.map((payment, index) => (
                              <div
                                key={payment.id}
                                className="flex justify-between items-center bg-gray-100 p-3 rounded"
                              >
                                <span>{index + 1}</span>

                                <span className="font-medium text-green-600">
                                  {formatMoney(payment.amount)} AFN
                                </span>
                                <span>
                                  {new Date(
                                    payment.paymentDate,
                                  ).toLocaleDateString("fa-AF")}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">
                            هنوز پرداختی ثبت نشده است
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <GiTakeMyMoney className="text-6xl text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">هیچ قرضه فعالی یافت نشد</p>
                </div>
              )}
            </div>
          )}

          {/* Closed Loans Tab */}
          {activeTab === "closed" && (
            <div className="space-y-4">
              {filteredClosedLoans.length > 0 ? (
                filteredClosedLoans.map((loan) => (
                  <div
                    key={loan.id}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <FaUser className="text-gray-500" />
                          <h3 className="font-bold text-gray-800">
                            {loan.Employee?.fullName}
                          </h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-500">مبلغ قرضه</p>
                            <p className="font-medium">
                              {formatMoney(loan.amount)} AFN
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">تاریخ تسویه</p>
                            <p className="text-sm">
                              {new Date(loan.updatedAt).toLocaleDateString(
                                "fa-AF",
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs">
                        تسویه شده
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">
                  هیچ قرضه تسویه شده‌ای یافت نشد
                </p>
              )}
            </div>
          )}

          {/* Payment History Tab */}
          {activeTab === "history" && (
            <div className="space-y-4">
              {activeLoans.map((loan) => (
                <div
                  key={loan.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <FaUser className="text-teal-700" />
                      <span className="font-medium">
                        {loan.Employee?.fullName}
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        setSelectedLoan(
                          selectedLoan === loan.id ? null : loan.id,
                        )
                      }
                      className="text-teal-700 text-sm"
                    >
                      {selectedLoan === loan.id ? "بستن" : "نمایش پرداخت‌ها"}
                    </button>
                  </div>

                  {selectedLoan === loan.id && (
                    <div className="mt-3 pt-3 border-t">
                      {loan.LoanPayments?.length > 0 ? (
                        loan.LoanPayments.map((payment) => (
                          <div
                            key={payment.id}
                            className="flex justify-between items-center py-2"
                          >
                            <span className="text-sm text-gray-600">
                              {new Date(payment.paymentDate).toLocaleDateString(
                                "fa-AF",
                              )}
                            </span>
                            <span className="font-medium text-green-600">
                              {formatMoney(payment.amount)} AFN
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">
                          هنوز پرداختی ثبت نشده است
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Loan Modal */}
      {showLoanModal && (
        <AnimatedModal
          isOpen={showLoanModal}
          onClose={() => {
            setShowLoanModal(false);
            resetForm();
          }}
        >
          <div className="bg-white rounded-lg p-6 w-full ">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">ثبت قرضه جدید</h2>
              <button
                onClick={() => setShowLoanModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleLoanSubmit} className="space-y-4">
              <SearchableEmployeeSelect
                employees={employees}
                loanForm={loanForm}
                setLoanForm={setLoanForm}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  مبلغ قرضه (افغانی) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={loanForm.amount}
                  onChange={(e) =>
                    setLoanForm({ ...loanForm, amount: e.target.value })
                  }
                  className="w-full p-3 bg-gray-200 border-gray-300 rounded-md focus:ring-1 focus:ring-teal-700 focus:border-transparent focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  تاریخ قرضه <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={loanForm.loanDate}
                  onChange={(e) =>
                    setLoanForm({ ...loanForm, loanDate: e.target.value })
                  }
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full p-3 bg-gray-200 border-gray-300 rounded-md focus:ring-1 focus:ring-teal-700 focus:border-transparent focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  توضیحات
                </label>
                <textarea
                  value={loanForm.description}
                  onChange={(e) =>
                    setLoanForm({ ...loanForm, description: e.target.value })
                  }
                  rows="1"
                  className="w-full p-3 bg-gray-200 border-gray-300 rounded-md focus:ring-1 focus:ring-teal-700 focus:border-transparent focus:outline-none"
                  placeholder="دلیل قرضه..."
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={createLoanMutation.isLoading}
                  className="flex-1 bg-teal-700 hover:bg-teal-800 text-white py-2 rounded-md transition disabled:bg-teal-300"
                >
                  {createLoanMutation.isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      در حال ثبت...
                    </span>
                  ) : (
                    "ثبت قرضه"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowLoanModal(false)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-md transition"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </AnimatedModal>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <AnimatedModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            resetPaymentForm();
          }}
        >
          <div className="bg-white rounded-md p-6 w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                ثبت پرداختی قرضه
              </h2>
              {selectedLoan && (
                <div className="flex items-center gap-x-3">
                  <p className="text-xs text-gray-500">باقی‌مانده</p>
                  <p className="font-bold text-red-600">
                    {formatMoney(
                      activeLoans.find((l) => l.id === selectedLoan)
                        ?.remainingAmount || 0,
                    )}{" "}
                  </p>
                </div>
              )}
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  resetPaymentForm();
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  مبلغ پرداخت <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, amount: e.target.value })
                  }
                  className="w-full p-3 bg-gray-200 border-gray-300 rounded-md focus:ring-1 focus:ring-teal-700 focus:border-transparent focus:outline-none"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  تاریخ پرداخت
                </label>
                <input
                  type="date"
                  value={paymentForm.paymentDate}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      paymentDate: e.target.value,
                    })
                  }
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full p-3 bg-gray-200 border-gray-300 rounded-md focus:ring-1 focus:ring-teal-700 focus:border-transparent focus:outline-none"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={paymentMutation.isLoading}
                  className="flex-1 bg-teal-700 hover:bg-teal-800 text-white py-2 rounded-md transition disabled:bg-teal-300"
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
                    resetPaymentForm();
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-gray-100 py-2 rounded-md transition"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </AnimatedModal>
      )}
      {showPrintModal && selectedLoanForPrint && (
        <LoanPrintReceipt
          isOpen={showPrintModal}
          onClose={() => {
            setShowPrintModal(false);
            setSelectedLoanForPrint(null);
          }}
          loan={selectedLoanForPrint}
          payments={getLoanPaymentsForPrint(selectedLoanForPrint.id)}
          employee={getEmployeeForPrint(selectedLoanForPrint)}
          autoPrint={false}
        />
      )}
    </div>
  );
};;

export default LoansPage;
