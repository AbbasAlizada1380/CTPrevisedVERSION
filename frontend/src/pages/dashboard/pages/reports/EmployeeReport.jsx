import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getAllEmployeesSafe,
  getEmployeeLoanHistory,
  formatMoney,
} from "../../services/EmployeesService";
import {
  FaSearch,
  FaUserTie,
  FaMoneyBillWave,
  FaUser,
  FaPhone,
  FaBriefcase,
  FaWallet,
  FaHistory,
  FaCheckCircle,
  FaTimesCircle,
  FaPrint, // Add this import
} from "react-icons/fa";
import LoanPrintReceipt from "../../../../components/LoanPrintReceipt"; // Add this import

const EmployeeReport = () => {
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showPrintModal, setShowPrintModal] = useState(false); // Add this
  const [selectedLoanForPrint, setSelectedLoanForPrint] = useState(null); // Add this

  // Fetch all employees
  const { data: employees, isLoading: employeesLoading } = useQuery({
    queryKey: ["allEmployees"],
    queryFn: getAllEmployeesSafe,
  });

  // Auto-select first employee when data loads
  useEffect(() => {
    if (employees && employees.length > 0 && !selectedEmployee) {
      setSelectedEmployee(employees[0].id);
    }
  }, [employees, selectedEmployee]);

  // Fetch selected employee loan history
  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ["employeeLoanHistory", selectedEmployee],
    queryFn: () => getEmployeeLoanHistory(selectedEmployee),
    enabled: !!selectedEmployee,
  });

  // Add print handler
  const handlePrintLoan = (loan) => {
    setSelectedLoanForPrint(loan);
    setShowPrintModal(true);
  };

  // Filter employees based on search
  const filteredEmployees = employees?.filter(
    (emp) =>
      emp.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.phone?.includes(searchTerm) ||
      emp.position?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const employeeData = history?.data;
  const statistics = employeeData?.statistics || {};
  const selectedEmpDetails = employees?.find((e) => e.id === selectedEmployee);

  // Loading state
  if (employeesLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-700"></div>
      </div>
    );
  }

  return (
    <div className="pt-3" dir="rtl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <FaUserTie className="text-teal-700" />
        گزارش کارمندان
      </h1>

      {/* Main Grid - Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side - Employee List (4 columns) */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-md shadow overflow-hidden sticky top-4">
            {/* Header */}
            <div className="p-4 bg-teal-700 flex items-center justify-between text-white">
              <h2 className="font-bold flex items-center gap-2">
                <FaUser />
                لیست کارمندان
              </h2>
              <p className="text-xs text-teal-100 mt-1">
                {filteredEmployees?.length || 0} کارمند
              </p>
            </div>

            {/* Search Bar */}
            <div className="p-3 border-b">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="جستجوی کارمند..."
                  className="w-full p-2 pr-8  bg-gray-200 rounded-md focus:ring-1 focus:ring-teal-700 focus:outline-none"
                />
                <FaSearch className="absolute left-2 top-3 text-gray-400" />
              </div>
            </div>

            {/* Employee List */}
            <div className="max-h-[600px] overflow-y-auto divide-y">
              {filteredEmployees?.length > 0 ? (
                filteredEmployees.map((emp) => {
                  const isSelected = selectedEmployee === emp.id;
                  const hasActiveLoan = emp.Wallet?.remainingBalance > 0;

                  return (
                    <div
                      key={emp.id}
                      onClick={() => setSelectedEmployee(emp.id)}
                      className={`p-4 cursor-pointer transition-all ${
                        isSelected
                          ? "bg-teal-50 border-r-4 border-teal-700"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isSelected ? "bg-teal-700" : "bg-gray-200"
                          }`}
                        >
                          <FaUser
                            className={
                              isSelected ? "text-white" : "text-gray-600"
                            }
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2  text-gray-500 mt-1">
                            <h3
                              className={`font-medium truncate ${
                                isSelected ? "text-teal-700" : "text-gray-900"
                              }`}
                            >
                              {emp.fullName}
                            </h3>
                            <span className="flex items-center gap-1">
                              {emp.position}
                            </span>
                          </div>

                          <div className="flex items-center justify-between mt-2">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                hasActiveLoan
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {hasActiveLoan ? "دارای قرضه" : "بدون قرضه"}
                            </span>
                            {hasActiveLoan && (
                              <span className="text-xs font-medium text-yellow-600">
                                {formatMoney(emp.Wallet?.remainingBalance)} AFN
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <FaUser className="text-4xl mx-auto mb-2 text-gray-300" />
                  <p>نتیجه‌ای یافت نشد</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side - Employee Details (8 columns) */}
        <div className="lg:col-span-8">
          {selectedEmployee && employeeData ? (
            <div className="space-y-6">
              {/* Employee Info Card */}
              <div className="bg-gray-200 rounded-lg shadow p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FaUserTie className="text-teal-700" />
                  اطلاعات کارمند
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="font-medium text-gray-900">
                      {employeeData.employee?.fullName}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="font-medium text-gray-900">
                      {employeeData.employee?.position}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="font-medium text-gray-900" dir="ltr">
                      {employeeData.employee?.phone}
                    </p>
                  </div>
                </div>
              </div>

              {/* Statistics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-100 rounded-md shadow p-4">
                  <p className="text-xs text-gray-500">تعداد کل قرضه‌ها</p>
                  <p className="text-xl font-bold text-teal-700 mt-1">
                    {statistics.totalLoans || 0}
                  </p>
                </div>
                <div className="bg-gray-100 rounded-md shadow p-4">
                  <p className="text-xs text-gray-500">قرضه‌های فعال</p>
                  <p className="text-xl font-bold text-yellow-600 mt-1">
                    {statistics.activeLoans || 0}
                  </p>
                </div>
                <div className="bg-gray-100 rounded-md shadow p-4">
                  <p className="text-xs text-gray-500">مجموع قرضه‌ها</p>
                  <p className="text-base font-bold text-teal-700 mt-1">
                    {formatMoney(statistics.totalAmount)} AFN
                  </p>
                </div>
                <div className="bg-gray-100 rounded-md shadow p-4">
                  <p className="text-xs text-gray-500">مجموع پرداخت‌ها</p>
                  <p className="text-base font-bold text-purple-600 mt-1">
                    {formatMoney(statistics.totalPaid)} AFN
                  </p>
                </div>
              </div>

              {/* Loans List */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b flex justify-between items-center">
                  <h2 className="font-bold text-gray-800 flex items-center gap-2">
                    <FaMoneyBillWave className="text-teal-700" />
                    لیست قرضه‌ها
                  </h2>
                  <span className="text-sm text-gray-500">
                    {employeeData.loans?.length || 0} قرضه
                  </span>
                </div>

                <div className="p-4">
                  {historyLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-700"></div>
                    </div>
                  ) : employeeData.loans?.length > 0 ? (
                    <div className="space-y-4">
                      {employeeData.loans.map((loan) => (
                        <div
                          key={loan.id}
                          className="border border-gray-200 rounded-md p-4 hover:shadow-md transition"
                        >
                          {/* Loan Header */}
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  loan.status === "Active"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-green-100 text-green-800"
                                }`}
                              >
                                {loan.status === "Active"
                                  ? "فعال"
                                  : "تسویه شده"}
                              </span>
                              <span className="text-sm text-gray-500">
                                {new Date(loan.loanDate).toLocaleDateString(
                                  "fa-AF",
                                )}
                              </span>
                            </div>
                            <button
                              onClick={() => handlePrintLoan(loan)}
                              className="text-teal-700 hover:text-purple-800 transition"
                              title="چاپ گزارش قرضه"
                            >
                              <FaPrint size={16} />
                            </button>
                            <div className="flex items-center gap-2">
                              {loan.description && (
                                <span className="text-xs text-gray-500 max-w-[200px] truncate">
                                  {loan.description}
                                </span>
                              )}
                              {/* Print Button */}
                            </div>
                          </div>

                          {/* Loan Amounts */}
                          <div className="grid grid-cols-3 gap-4 mb-3">
                            <div>
                              <p className="text-xs text-gray-500">مبلغ قرضه</p>
                              <p className="font-bold text-teal-700">
                                {formatMoney(loan.amount)} AFN
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">
                                پرداخت شده
                              </p>
                              <p className="font-bold text-green-600">
                                {formatMoney(
                                  loan.amount - loan.remainingAmount,
                                )}{" "}
                                AFN
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">
                                باقی‌مانده
                              </p>
                              <p
                                className={`font-bold ${
                                  loan.remainingAmount > 0
                                    ? "text-yellow-600"
                                    : "text-green-600"
                                }`}
                              >
                                {formatMoney(loan.remainingAmount)} AFN
                              </p>
                            </div>
                          </div>

                          {/* Payment History */}
                          {loan.LoanPayments?.length > 0 && (
                            <div className="mt-3 pt-3 border-t">
                              <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                                <FaHistory className="text-teal-600" />
                                تاریخچه پرداخت‌ها
                              </p>
                              <div className="space-y-2 max-h-40 overflow-y-auto">
                                {loan.LoanPayments.map((payment, index) => (
                                  <div
                                    key={payment.id}
                                    className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded hover:bg-gray-100 transition"
                                  >
                                    <div className="flex items-center gap-4">
                                      <span className="text-gray-500 w-6">
                                        {index + 1}.
                                      </span>
                                      <span className="text-gray-600">
                                        {new Date(
                                          payment.paymentDate,
                                        ).toLocaleDateString("fa-AF")}
                                      </span>
                                    </div>
                                    <span className="font-medium text-green-600">
                                      {formatMoney(payment.amount)} AFN
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FaMoneyBillWave className="text-5xl text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">
                        هیچ قرضه‌ای برای این کارمند یافت نشد
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <FaUserTie className="text-6xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                {selectedEmployee
                  ? "در حال بارگذاری اطلاعات..."
                  : "لطفاً یک کارمند را انتخاب کنید"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Print Modal */}
      {showPrintModal && selectedLoanForPrint && (
        <LoanPrintReceipt
          isOpen={showPrintModal}
          onClose={() => {
            setShowPrintModal(false);
            setSelectedLoanForPrint(null);
          }}
          loan={selectedLoanForPrint}
          payments={selectedLoanForPrint.LoanPayments || []}
          employee={selectedEmpDetails}
          autoPrint={false}
        />
      )}
    </div>
  );
};

export default EmployeeReport;
