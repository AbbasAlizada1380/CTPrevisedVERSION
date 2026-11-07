import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getCompanySummary, formatMoney } from "../../services/EmployeesService";
import {
  FaUsers,
  FaMoneyBillWave,
  FaWallet,
  FaChartLine,
} from "react-icons/fa";

const CompanyReport = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["companySummary"],
    queryFn: getCompanySummary,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        خطا در بارگذاری اطلاعات: {error.message}
      </div>
    );
  }

  const summary = data?.data?.summary || {};

  return (
    <div className="p-5">
      <h1 className="text-2xl font-bold text-gray-800">گزارش کلی سیستم</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mt-5 gap-4">
        {/* Total Employees */}
        <div className="bg-gray-200 rounded-md shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">تعداد کارمندان</p>
              <p className="text-xl font-bold text-teal-600">
                {summary.totalEmployees || 0}
              </p>
            </div>
            <div className="bg-white p-3 rounded-md">
              <FaUsers className="text-teal-600 text-xl" />
            </div>
          </div>
        </div>

        {/* Active Loans */}
        <div className="bg-gray-200 rounded-md shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">قرضه‌های فعال</p>
              <p className="text-xl font-bold text-yellow-600">
                {summary.totalActiveLoans || 0}
              </p>
            </div>
            <div className="bg-white p-3 rounded-md">
              <FaMoneyBillWave className="text-yellow-600 text-xl" />
            </div>
          </div>
        </div>

        {/* Total Loans Amount */}
        <div className="bg-gray-200 rounded-md shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">مجموع قرضه‌ها</p>
              <p className="text-base font-bold text-teal-700">
                {formatMoney(summary.totalLoanAmount || 0)} 
              </p>
            </div>
            <div className="bg-white p-3 rounded-md">
              <FaWallet className="text-teal-700 text-xl" />
            </div>
          </div>
        </div>

        {/* Total Remaining */}
        <div className="bg-gray-200 rounded-md shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">باقی‌مانده کل</p>
              <p className="text-base font-bold text-red-600">
                {formatMoney(summary.totalRemainingBalance || 0)} 
              </p>
            </div>
            <div className="bg-white p-3 rounded-md">
              <FaChartLine className="text-red-600 text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 mt-6 gap-6">
        {/* Recent Loans */}
        <div className="bg-white rounded-md shadow">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-bold text-gray-800">آخرین قرضه‌ها</h2>
          </div>
          <div className="p-4">
            {data?.data?.recentActivities?.loans?.length > 0 ? (
              <div className="space-y-3">
                {data.data.recentActivities.loans.map((loan) => (
                  <div key={loan.id} className="border bg-gray-100 rounded border-gray-200 p-3">
                    <div className="flex justify-between">
                      <span className="font-medium">
                        {loan.Employee?.fullName}
                      </span>
                      <span className="text-sm text-gray-600">
                        {new Date(loan.loanDate).toLocaleDateString("fa-AF")}
                      </span>
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-sm text-gray-600">مقدار:</span>
                      <span className="font-medium text-teal-700">
                        {formatMoney(loan.amount)} AFN
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">
                هیچ قرضه‌ای ثبت نشده است
              </p>
            )}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="font-bold text-gray-800">آخرین پرداخت‌ها</h2>
          </div>
          <div className="p-4">
            {data?.data?.recentActivities?.payments?.length > 0 ? (
              <div className="space-y-3">
                {data.data.recentActivities.payments.map((payment) => (
                  <div key={payment.id} className="border  border-gray-200 bg-gray-100 rounded p-3">
                    <div className="flex justify-between">
                      <span className="font-medium">
                        {payment.Loan?.Employee?.fullName}
                      </span>
                      <span className="text-sm text-gray-600">
                        {new Date(payment.paymentDate).toLocaleDateString(
                          "fa-AF",
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-sm text-gray-600">مبلغ:</span>
                      <span className="font-medium text-teal-700">
                        {formatMoney(payment.amount)} AFN
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">
                هیچ پرداختی ثبت نشده است
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyReport;
