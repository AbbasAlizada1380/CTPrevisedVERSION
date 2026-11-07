import React, { useEffect, useRef } from "react";
import { FaPrint, FaTimes } from "react-icons/fa";
import jalaali from "jalaali-js";
import AnimatedModal from "./common/AnimatedModal";

const LoanPrintReceipt = ({
  isOpen,
  onClose,
  loan,
  payments = [],
  employee,
  autoPrint = false,
}) => {
  const hasAutoPrintedRef = useRef(false);
  const printTimeoutRef = useRef(null);

  // Safe number parsing function
  const parseSafeNumber = (value) => {
    if (value === null || value === undefined || value === "") return 0;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  const formatCurrency = (num) => {
    const safeNum = parseSafeNumber(num);
    return safeNum.toLocaleString() + " افغانی";
  };

const formatToGregorian = (dateString) => {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    // Returns "4/5/2026" (month/day/year, no leading zeros)
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  } catch (error) {
    console.error("Date parsing error:", error);
    return "-";
  }
};
  const calculatePaidAmount = () => {
    if (!payments || payments.length === 0) return 0;

    return payments.reduce((sum, payment) => {
      const amount = parseSafeNumber(payment?.amount);
      return sum + amount;
    }, 0);
  };

  const handlePrint = () => {
    window.print();
  };

  // Auto print
  useEffect(() => {
    if (autoPrint && isOpen && loan && !hasAutoPrintedRef.current) {
      hasAutoPrintedRef.current = true;
      printTimeoutRef.current = setTimeout(() => {
        window.print();
      }, 800);
    }
    return () => {
      if (printTimeoutRef.current) {
        clearTimeout(printTimeoutRef.current);
      }
    };
  }, [autoPrint, isOpen, loan]);

  // Reset print flag
  useEffect(() => {
    if (!isOpen) {
      hasAutoPrintedRef.current = false;
    }
  }, [isOpen]);

  if (!isOpen || !loan || !employee) {
    return null;
  }

  // Safe calculations with fallbacks
  const loanAmount = parseSafeNumber(loan.amount);
  const paidAmount = calculatePaidAmount();
  const remainingAmount = Math.max(0, loanAmount - paidAmount);
  const paidPercentage =
    loanAmount > 0 ? ((paidAmount / loanAmount) * 100).toFixed(1) : "0.0";

  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={onClose}
      className="p-0"
      maxWidth="max-w-lg"
    >
      {/* A5 Container */}
      <div className="">
        <div
          id="printable-area"
          className="bg-white shadow-2xl overflow-hidden flex flex-col print:shadow-none print:rounded-none relative"
          style={{
            width: "148mm",
            height: "210mm",
            direction: "rtl",
            border: "1px solid #000",
          }}
        >
          {/* Header */}
          <div className="text-center px-4 py-3 border-b border-gray-400 bg-gray-50">
            <h2 className="text-lg font-bold text-gray-800">
              گزارش قرضه کارمند
            </h2>
            <p className="text-xs text-gray-600 mt-1">
              {loan.status === "Active" ? "قرضه فعال" : "قرضه تسویه شده"}
            </p>
          </div>

          {/* Employee Info */}
          <div className="px-6 py-3 border-b border-gray-400">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-bold">نام کارمند: </span>
                <span>{employee.fullName || "———"}</span>
              </div>
              <div>
                <span className="font-bold">شماره تماس: </span>
                <span>{employee.phone || "———"}</span>
              </div>
              <div>
                <span className="font-bold">وظیفه: </span>
                <span>{employee.position || "———"}</span>
              </div>
              <div>
                <span className="font-bold">تاریخ قرضه: </span>
                <span>{formatToGregorian(loan.loanDate)}</span>
              </div>
            </div>
          </div>

          {/* Loan Summary */}
          <div className="px-4 py-4 border-b border-gray-400">
            <h3 className="font-bold text-center mb-3 text-gray-700">
              خلاصه قرضه
            </h3>
            <div className="space-y-3">
              {/* Total Amount */}
              <div className="flex justify-between items-center border-b border-dashed border-gray-300 pb-2">
                <span className="font-bold text-sm">مبلغ کل قرضه:</span>
                <span className="font-bold text-sm text-blue-700">
                  {formatCurrency(loanAmount)}
                </span>
              </div>

              {/* Paid Amount */}
              <div className="flex justify-between items-center border-b border-dashed border-gray-300 pb-2">
                <span className="font-bold text-sm text-green-700">
                  مبلغ پرداخت شده:
                </span>
                <span className="font-bold text-sm text-green-700">
                  {formatCurrency(paidAmount)}
                </span>
              </div>

              {/* Remaining Amount */}
              <div className="flex justify-between items-center border-b border-dashed border-gray-300 pb-2">
                <span className="font-bold text-sm text-red-700">
                  باقی‌مانده:
                </span>
                <span
                  className={`font-bold ${remainingAmount > 0 ? "text-red-700" : "text-green-700"}`}
                >
                  {formatCurrency(remainingAmount)}
                </span>
              </div>

              {/* Payment Progress Bar (Optional) */}
              {loanAmount > 0 && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span>درصد پرداخت:</span>
                    <span className="font-bold">{paidPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        paidPercentage === "100.0"
                          ? "bg-green-600"
                          : "bg-blue-600"
                      }`}
                      style={{
                        width: `${Math.min(100, parseFloat(paidPercentage))}%`,
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment History */}
          <div className="px-4 py-2 border-b border-gray-400">
            <h3 className="font-bold text-center mb-3 text-gray-700">
              تاریخچه پرداخت‌ها
            </h3>
            {payments.length > 0 ? (
              <div className="space-y-2">
                {/* Header */}
                <div className="grid grid-cols-3 gap-2 text-xs font-bold border-b border-gray-400 pb-2">
                  <span className="text-center">شماره</span>
                  <span className="text-center">تاریخ</span>
                  <span className="text-center">مبلغ (افغانی)</span>
                </div>

                {/* Payment Rows */}
                {payments.map((payment, index) => {
                  const paymentAmount = parseSafeNumber(payment?.amount);
                  return (
                    <div
                      key={payment.id || index}
                      className="grid grid-cols-3 gap-2 text-sm py-1 border-b border-dashed border-gray-200"
                    >
                      <span className="text-center">{index + 1}</span>
                      <span className="text-center">
                        {formatToGregorian(payment.paymentDate)}
                      </span>
                      <span className="text-center font-medium text-green-600">
                        {formatCurrency(paymentAmount)}
                      </span>
                    </div>
                  );
                })}

                {/* Total Row */}
                <div className="grid grid-cols-3 gap-2 text-sm pt-2 font-bold">
                  <span className="text-center col-span-2">مجموع:</span>
                  <span className="text-center text-green-700">
                    {formatCurrency(paidAmount)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500">هیچ پرداختی ثبت نشده است</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-6 mt-auto">
            <div className="grid grid-cols-2 gap-8 text-sm">
              <div className="text-center">
                <p className="font-bold mb-6">امضاء مسئول</p>
                <div className="border-b border-gray-400 w-32 mx-auto"></div>
              </div>
              <div className="text-center">
                <p className="font-bold mb-6">مهر شرکت</p>
                <div className="border-b border-gray-400 w-32 mx-auto"></div>
              </div>
            </div>
            <p className="text-center text-xs text-gray-500 mt-4">
              تاریخ چاپ: {new Date().toLocaleDateString("eng-en")}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="absolute bottom-6 left-6 flex gap-3 print:hidden">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center gap-2 shadow-lg transition-colors"
        >
          <FaTimes size={14} /> بستن
        </button>
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg flex items-center gap-2 shadow-lg transition-colors"
        >
          <FaPrint size={14} /> چاپ گزارش
        </button>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A5 portrait;
            margin: 0;
          }
          body * {
            visibility: hidden;
          }
          #printable-area,
          #printable-area * {
            visibility: visible;
          }
          #printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 148mm !important;
            height: 210mm !important;
            margin: 0;
            padding: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            border: 1px solid #000 !important;
          }
          .print-hidden {
            display: none !important;
          }
          table,
          div {
            break-inside: avoid;
          }
        }
        @media print {
          ::-webkit-scrollbar {
            display: none;
          }
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </AnimatedModal>
  );
};

export default LoanPrintReceipt;
