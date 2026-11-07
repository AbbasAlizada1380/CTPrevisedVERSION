import { useEffect, useState } from "react";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_BASE_URL;

export default function ActiveLoansModal({ onClose }) {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/loans/active`);
        if (res.data.success && res.data.data.loans) {
          setLoans(res.data.data.loans);
        } else {
          setLoans([]);
        }
      } catch (err) {
        console.error("Failed to fetch active loans:", err);
        setLoans([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const money = (val) =>
    new Intl.NumberFormat("en").format(Math.round(val || 0)) + " افغانی";

  const totalRemaining = loans.reduce(
    (sum, loan) => sum + Number(loan.remainingAmount),
    0
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-gradient-to-br from-white to-gray-50 w-full max-w-4xl rounded-2xl shadow-2xl animate-slideUp">
        {/* Header */}
        <div className="sticky top-0 bg-white/90 backdrop-blur-sm rounded-t-2xl border-b border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                قرض‌های فعال کارمندان
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                لیست کارمندانی که قرض فعال دارند
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
              aria-label="بستن"
            >
              <span className="text-gray-600 text-2xl font-light">×</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600 font-medium">
                در حال بارگذاری اطلاعات...
              </p>
              <p className="text-gray-400 text-sm mt-1">لطفاً کمی صبر کنید</p>
            </div>
          ) : loans.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 text-gray-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-gray-500 text-lg font-semibold mb-2">
                قرض فعالی وجود ندارد
              </h3>
              <p className="text-gray-400">
                تمام کارمندان قرض خود را تسویه کرده‌اند
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {/* Summary Card */}
              <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 rounded-xl p-4 mb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-600 text-sm">مجموع قرض‌ها</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">
                      {money(totalRemaining)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-800 mt-1">
                      {loans.length} نفر
                    </p>
                  </div>
                </div>
              </div>

              {/* Loans List */}
              <div className="space-y-3">
                {loans.map((loan) => (
                  <div
                    key={loan.id}
                    className="group bg-white hover:bg-gray-50 border border-gray-200 hover:border-red-200 rounded-xl p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                  >
                    <div className="flex flex-wrap justify-between items-center gap-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800 text-lg group-hover:text-red-600 transition-colors">
                          {loan.Employee?.fullName || "نامشخص"}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {loan.Employee?.position || "بدون سمت"} •{" "}
                          {new Date(loan.loanDate).toLocaleDateString("eng-en")}
                        </p>
                        {loan.description && (
                          <p className="text-xs text-gray-400 mt-1">
                            {loan.description}
                          </p>
                        )}
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-red-600 text-xl">
                          {money(loan.remainingAmount)}
                        </p>
                        <p className="text-xs text-gray-400">
                          از {money(loan.amount)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 rounded-b-2xl p-4">
          <div className="flex justify-between items-center">
            <button
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200 font-medium"
            >
              بستن
            </button>
            {!loading && loans.length > 0 && (
              <div className="text-sm text-gray-500">
                مجموع: <span className="font-semibold">{loans.length}</span> کارمند
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Close on backdrop click */}
      <div className="absolute inset-0 -z-10" onClick={onClose} />
    </div>
  );
}