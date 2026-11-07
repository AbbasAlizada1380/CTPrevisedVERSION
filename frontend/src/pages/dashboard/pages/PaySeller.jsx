// PaySeller.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { FaMoneyBillWave, FaTimes, FaCheckCircle, FaSpinner } from "react-icons/fa";
import Pagination from "../pagination/Pagination";

const BASE_URL = import.meta.env.VITE_BASE_URL;
const limit = 20;

const PaySeller = () => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDescription, setPaymentDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [includeDetails, setIncludeDetails] = useState(false);

  // Fetch sellers with unpaid factors
  const fetchSellers = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${BASE_URL}/seller_accounts/debt`, {
        params: { page, limit, includeFactorDetails: includeDetails },
      });

      if (response.data.success) {
        setSellers(response.data.data);
        setCurrentPage(response.data.page);
        setTotalPages(response.data.totalPages);
        setTotalRecords(response.data.totalRecords);
      } else {
        setError(response.data.message || "خطا در دریافت لیست بدهکاران");
      }
    } catch (err) {
      setError(err.response?.data?.message || "خطا در ارتباط با سرور");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers(currentPage);
  }, [currentPage, includeDetails]);

  // Handle payment submission
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSeller) {
      setError("لطفاً فروشنده را انتخاب کنید");
      return;
    }
    const amountNum = parseFloat(paymentAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("مقدار پرداخت باید یک عدد مثبت باشد");
      return;
    }
    if (amountNum > selectedSeller.totalUnpaidAmount) {
      setError(`مبلغ پرداختی نمی‌تواند بیشتر از بدهی کل (${selectedSeller.totalUnpaidAmount.toFixed(2)}) باشد`);
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMessage("");

    try {
      const response = await axios.post(`${BASE_URL}/pays`, {
        sellerId: selectedSeller.seller.id,
        amount: amountNum,
        description: paymentDescription.trim() || `پرداخت بدهی فروشنده ${selectedSeller.seller.fullname}`,
      });

      if (response.status === 201) {
        setSuccessMessage(`پرداخت مبلغ ${amountNum.toLocaleString()} افغانی با موفقیت ثبت شد!`);
        // Close modal and refresh list
        setSelectedSeller(null);
        setPaymentAmount("");
        setPaymentDescription("");
        fetchSellers(currentPage);
        // Auto‑clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setError(response.data.message || "ثبت پرداخت失败");
      }
    } catch (err) {
      setError(err.response?.data?.message || "خطا در ثبت پرداخت");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const openPaymentModal = (seller) => {
    setSelectedSeller(seller);
    setPaymentAmount("");
    setPaymentDescription("");
    setError(null);
    setSuccessMessage("");
  };

  return (
    <div className="mt-12 bg-white rounded-lg shadow-lg border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-200 rounded-t-md p-6">
        <div className="flex items-center gap-x-4">
          <div className="p-3 bg-cyan-100 rounded-full">
            <FaMoneyBillWave className="text-cyan-800 text-xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">لیست بدهکاران</h2>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={includeDetails}
            onChange={(e) => setIncludeDetails(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300"
          />
          نمایش جزئیات فاکتورها
        </label>
      </div>

      {/* Error / Success Messages */}
      {error && (
        <div className="mx-6 mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="mx-6 mt-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded flex items-center gap-2">
          <FaCheckCircle className="text-green-600" />
          {successMessage}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto p-6">
        <table className="w-full text-center border border-gray-300">
          <thead className="bg-cyan-800 text-white">
            <tr>
              <th className="border px-4 py-2">#</th>
              <th className="border px-4 py-2">نام فروشنده</th>
              <th className="border px-4 py-2">شماره تماس</th>
              <th className="border px-4 py-2">تعداد فاکتورهای بدهی</th>
              <th className="border px-4 py-2">مبلغ بدهی کل</th>
              <th className="border px-4 py-2">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="py-4 text-gray-500">
                  در حال بارگذاری...
                </td>
              </tr>
            ) : sellers.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-4 text-gray-500">
                  هیچ فروشنده بدهکاری یافت نشد.
                </td>
              </tr>
            ) : (
              sellers.map((sellerData, idx) => (
                <tr key={sellerData.seller.id} className="hover:bg-gray-50">
                  <td className="border px-4 py-2">{idx + 1}</td>
                  <td className="border px-4 py-2 font-medium">{sellerData.seller.fullname}</td>
                  <td className="border px-4 py-2">{sellerData.seller.phoneNumber || "—"}</td>
                  <td className="border px-4 py-2">{sellerData.unpaidFactorCount}</td>
                  <td className="border px-4 py-2 font-bold text-red-600">
                    {sellerData.totalUnpaidAmount.toLocaleString()} افغانی
                  </td>
                  <td className="border px-4 py-2">
                    <button
                      onClick={() => openPaymentModal(sellerData)}
                      className="bg-cyan-800 hover:bg-cyan-900 text-white px-4 py-1 rounded-md text-sm flex items-center gap-1 mx-auto"
                    >
                      <FaMoneyBillWave />
                      تسویه
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
      </div>

      {/* Payment Modal */}
      {selectedSeller && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-bold text-gray-800">
                پرداخت به {selectedSeller.seller.fullname}
              </h3>
              <button
                onClick={() => setSelectedSeller(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-gray-700 mb-1">مبلغ بدهی کل</label>
                <div className="text-2xl font-bold text-cyan-800">
                  {selectedSeller.totalUnpaidAmount.toLocaleString()} افغانی
                </div>
                {selectedSeller.unpaidFactorCount > 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    تعداد فاکتورهای باز: {selectedSeller.unpaidFactorCount}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-gray-700 mb-1">مبلغ پرداختی (افغانی)</label>
                <input
                  type="number"
                  step="1000"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="مبلغ را وارد کنید"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">توضیحات (اختیاری)</label>
                <textarea
                  value={paymentDescription}
                  onChange={(e) => setPaymentDescription(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  rows="2"
                  placeholder="توضیحات..."
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedSeller(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={submitting}
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-cyan-800 text-white rounded-lg hover:bg-cyan-900 disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />}
                  {submitting ? "در حال ثبت..." : "ثبت پرداخت"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaySeller;