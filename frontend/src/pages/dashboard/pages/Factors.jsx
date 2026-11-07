import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify"; // ✅ added missing import
import "react-toastify/dist/ReactToastify.css";
import moment from "moment-jalaali";
import Pagination from "../pagination/Pagination"; // ✅ import the new component

const BASE_URL = import.meta.env.VITE_BASE_URL;
const API_URL = `${BASE_URL}/factors`;
const INCOMES_BY_FACTOR = `${BASE_URL}/stock/income/by-factor`;

const Factors = () => {
  const [factors, setFactors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [currentPage, setCurrentPage] = useState(1);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedFactor, setSelectedFactor] = useState(null);
  const [factorIncomes, setFactorIncomes] = useState([]);
  const [loadingIncomes, setLoadingIncomes] = useState(false);

  useEffect(() => {
    fetchFactors(currentPage);
  }, [currentPage]);

  const fetchFactors = async (page = 1) => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL, {
        params: { page, limit: 10 },
      });
      const { factors, pagination } = response.data;
      setFactors(factors);
      setPagination(pagination);
    } catch (error) {
      console.error("Error fetching factors:", error);
      toast.error("خطا در دریافت لیست فاکتورها");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setCurrentPage(page);
    }
  };

  // Status badge style
  const getStatusBadge = (status) => {
    const base = "px-3 py-1 rounded-full text-sm font-semibold";
    switch (status) {
      case "paid":
        return `${base} bg-green-100 text-green-800`;
      case "partial":
        return `${base} bg-yellow-100 text-yellow-800`;
      case "unpaid":
        return `${base} bg-red-100 text-red-800`;
      default:
        return `${base} bg-gray-100 text-gray-800`;
    }
  };

  // ---- Modal Handlers ----
  const handleViewIncomes = async (factor) => {
    setSelectedFactor(factor);
    setShowModal(true);
    setLoadingIncomes(true);
    try {
      const response = await axios.get(`${INCOMES_BY_FACTOR}/${factor.id}`, {
        params: { page: 1, limit: 100 },
      });
      setFactorIncomes(response.data.incomes || []);
    } catch (error) {
      console.error("Error fetching incomes for factor:", error);
      toast.error("خطا در دریافت جزئیات فاکتور");
      setFactorIncomes([]);
    } finally {
      setLoadingIncomes(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedFactor(null);
    setFactorIncomes([]);
  };

  // Render incomes table inside modal
  const renderIncomesTable = () => {
    if (loadingIncomes) {
      return <div className="text-center py-4">در حال بارگذاری درآمدها...</div>;
    }
    if (factorIncomes.length === 0) {
      return <div className="text-center py-4 text-gray-500">هیچ درآمدی برای این فاکتور ثبت نشده است.</div>;
    }
    return (
      <div className="overflow-x-auto mt-4">
        <table className="min-w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2 text-sm">سایز</th>
              <th className="border p-2 text-sm">تعداد</th>
              <th className="border p-2 text-sm">قیمت واحد</th>
              <th className="border p-2 text-sm">مبلغ</th>
              <th className="border p-2 text-sm">تاریخ</th>
            </tr>
          </thead>
          <tbody>
            {factorIncomes.map((income) => (
              <tr key={income.id} className="text-center hover:bg-gray-50">
                <td className="border p-2 text-sm">{income.size}</td>
                <td className="border p-2 text-sm">{income.quantity}</td>
                <td className="border p-2 text-sm">{parseFloat(income.price).toLocaleString()}</td>
                <td className="border p-2 text-sm font-semibold">
                  {parseFloat(income.money).toLocaleString()}
                </td>
                <td className="border p-2 text-sm">
                  {moment(income.createdAt).format("jYYYY/jMM/jDD")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div>
      <ToastContainer
        position="top-left"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={true}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />

      {loading ? (
        <div className="text-center py-10">در حال بارگذاری...</div>
      ) : (
        <>
          <div className="bg-white rounded-t-md shadow-lg overflow-hidden overflow-x-auto">
            <table className="min-w-full leading-normal">
              <thead>
                <tr className="bg-cyan-800 text-white text-md font-semibold uppercase tracking-wider">
                  <th className="border border-gray-300 py-3 px-4">شماره فاکتور</th>
                  <th className="border border-gray-300 py-3 px-4">فروشنده</th>
                  <th className="border border-gray-300 py-3 px-4">مبلغ کل</th>
                  <th className="border border-gray-300 py-3 px-4">پرداخت شده</th>
                  <th className="border border-gray-300 py-3 px-4">باقیمانده</th>
                  <th className="border border-gray-300 py-3 px-4">وضعیت</th>
                  <th className="border border-gray-300 py-3 px-4">یادداشت</th>
                  <th className="border border-gray-300 py-3 px-4">تاریخ ایجاد</th>
                  <th className="border border-gray-300 py-3 px-4">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {factors.map((factor) => (
                  <tr
                    key={factor.id}
                    className="border-b border-gray-500 text-center hover:bg-gray-100 transition-colors duration-300"
                  >
                    <td className="px-5 py-3">
                      <p className="text-gray-900 whitespace-no-wrap">
                        {factor.factorNumber}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-gray-900 whitespace-no-wrap">
                        {factor.seller?.fullname || "نامشخص"}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-gray-900 whitespace-no-wrap">
                        {parseFloat(factor.totalAmount).toLocaleString()}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-gray-900 whitespace-no-wrap">
                        {parseFloat(factor.paidAmount).toLocaleString()}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-gray-900 whitespace-no-wrap">
                        {parseFloat(factor.remainingAmount).toLocaleString()}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <span className={getStatusBadge(factor.status)}>
                        {factor.status === "paid" && "پرداخت شده"}
                        {factor.status === "partial" && "نقد و اقساط"}
                        {factor.status === "unpaid" && "پرداخت نشده"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-gray-900 whitespace-no-wrap text-sm">
                        {factor.notes || "-"}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-gray-900 whitespace-no-wrap text-sm">
                        {moment(factor.createdAt).format("jYYYY/jMM/jDD")}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => handleViewIncomes(factor)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                      >
                        مشاهده جزئیات
                      </button>
                    </td>
                  </tr>
                ))}
                {factors.length === 0 && (
                  <tr>
                    <td colSpan="9" className="text-center py-6 text-gray-500">
                      هیچ فاکتوری یافت نشد.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ✅ New Pagination Component */}
          <Pagination
            currentPage={currentPage}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}

      {/* -------------------- MODAL -------------------- */}
      {showModal && selectedFactor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto p-6">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h2 className="text-xl font-bold text-gray-800">
                جزئیات فاکتور شماره {selectedFactor.factorNumber}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-red-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Factor Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 bg-gray-50 p-4 rounded">
              <div>
                <span className="text-sm text-gray-600">فروشنده</span>
                <p className="font-semibold">{selectedFactor.seller?.fullname || "نامشخص"}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">مبلغ کل</span>
                <p className="font-semibold text-green-700">
                  {parseFloat(selectedFactor.totalAmount).toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600">پرداخت شده</span>
                <p className="font-semibold text-blue-700">
                  {parseFloat(selectedFactor.paidAmount).toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600">باقیمانده</span>
                <p className="font-semibold text-red-700">
                  {parseFloat(selectedFactor.remainingAmount).toLocaleString()}
                </p>
              </div>
              <div className="col-span-2">
                <span className="text-sm text-gray-600">وضعیت</span>
                <span className={`${getStatusBadge(selectedFactor.status)} mr-2`}>
                  {selectedFactor.status === "paid" && "پرداخت شده"}
                  {selectedFactor.status === "partial" && "نقد و اقساط"}
                  {selectedFactor.status === "unpaid" && "پرداخت نشده"}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-sm text-gray-600">یادداشت</span>
                <p className="text-sm">{selectedFactor.notes || "-"}</p>
              </div>
            </div>

            {/* Incomes List */}
            <h3 className="text-lg font-semibold mb-2">لیست درآمدهای مربوطه</h3>
            {renderIncomesTable()}

            {/* Close button */}
            <div className="mt-4 text-left">
              <button
                onClick={closeModal}
                className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Factors;