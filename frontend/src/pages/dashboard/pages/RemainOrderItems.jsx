import { useEffect, useState } from "react";
import axios from "axios";
import {
  FaBoxOpen,
  FaSpinner,
  FaTimes,
  FaFileInvoiceDollar,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaChevronRight,
  FaChevronLeft,
  FaSearch
} from "react-icons/fa";
import OrderDownload from "./report/OrderDownload";
import Pagination from "../pagination/Pagination"
import OrderDownloadrange from "./report/orderDownloadrange";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const RemainOrderItems = ({ customer, onClose }) => {
  const [remainingMoney, setRemainingMoney] = useState(0);
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchRemainData = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/remain/customer`);
      const foundCustomer = res.data.customers.find(
        (item) => item.customer.id == customer.id
      );
      setRemainingMoney(foundCustomer?.remainingMoney || 0);
    } catch (err) {
      console.error(err);
      setError("خطا در دریافت مبلغ باقیمانده");
    }
  };

  const fetchRemainOrderItems = async (page = 1) => {
    if (!customer || !customer.id) return;

    try {
      setLoading(true);
      setError("");

      // Build query parameters
      const params = {
        page,
        limit: itemsPerPage,
      };

      if (searchTerm) {
        params.search = searchTerm;
      }

      if (statusFilter) {
        params.status = statusFilter;
      }

      const res = await axios.get(
        `${BASE_URL}/remain/${customer.id}/orders`,
        { params }
      );

      setOrderItems(res.data.orderItems || []);
      setTotalItems(res.data.pagination?.totalItems || 0);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setCurrentPage(res.data.pagination?.currentPage || 1);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "خطا در دریافت سفارشات باقیمانده"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customer?.id) {
      fetchRemainOrderItems(currentPage);
      fetchRemainData();
    }
  }, [customer, currentPage, searchTerm, statusFilter]);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    if (customer?.id) {
      setCurrentPage(1);
      fetchRemainOrderItems(1);
    }
  }, [searchTerm, statusFilter]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchRemainOrderItems(page);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRemainOrderItems(1);
  };

  if (!customer) return null;

  // Calculate totals from current page items
  const totalQuantity = orderItems.reduce((sum, item) => sum + (parseInt(item.qnty) || 0), 0);
  const totalMoney = orderItems.reduce((sum, item) => sum + (parseFloat(item.money) || 0), 0);
  const totalPrice = orderItems.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);

  return (
    <div className="mt-8 bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg shadow-lg border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-cyan-800 to-cyan-600 text-white rounded-t-lg p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-full">
            <FaBoxOpen className="text-xl" />
          </div>
          {/* <OrderDownload customerId={customer.id} /> */}
          <OrderDownloadrange customerId={customer.id}/>
          <div>
            <h2 className="text-xl font-bold">گزارش سفارشات</h2>
            <p className="text-sm text-white/80">
              مشتری: <span className="font-semibold">{customer.fullname}</span>
            </p>
            <p className="text-sm text-white/80">
              باقیمانده: <span className="font-semibold">{remainingMoney}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Stats */}
          <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-lg">
            <FaFileInvoiceDollar />
            <span className="text-sm">{totalItems} سفارش</span>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              title="بستن"
            >
              <FaTimes />
            </button>
          )}
        </div>
      </div>


      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <FaSpinner className="text-4xl text-cyan-800 animate-spin mb-4" />
            <p className="text-gray-600">در حال بارگذاری سفارشات...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-red-600 font-semibold">⚠️ {error}</p>
            <button
              onClick={() => fetchRemainOrderItems(currentPage)}
              className="mt-2 text-sm text-red-500 hover:text-red-700"
            >
              تلاش مجدد
            </button>
          </div>
        ) : orderItems.length === 0 ? (
          <div className="text-center py-12">
            <FaBoxOpen className="text-4xl text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-lg">هیچ سفارش باقیمانده‌ای وجود ندارد</p>
            <p className="text-gray-400 text-sm mt-1">تمام سفارشات این مشتری پرداخت شده است</p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm mb-4">
              <table className="w-full text-center">
                <thead className="bg-cyan-50 text-cyan-800">
                  <tr>
                    <th className="p-3 border-b font-semibold">#</th>
                    <th className="p-3 border-b font-semibold">نام فایل</th>
                    <th className="p-3 border-b font-semibold">سایز</th>
                    <th className="p-3 border-b font-semibold">تعداد</th>
                    <th className="p-3 border-b font-semibold">قیمت (افغانی)</th>
                    <th className="p-3 border-b font-semibold">مبلغ (افغانی)</th>
                    <th className="p-3 border-b font-semibold">پرداخت شده (افغانی)</th>
                    <th className="p-3 border-b font-semibold">تاریخ</th>
                  </tr>
                </thead>
                <tbody>
                  {orderItems.map((item, index) => (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50 border-b last:border-0 transition-colors"
                    >
                      <td className="p-3 text-gray-600">
                        {item.id}
                      </td>
                      <td className="p-3 font-medium text-gray-800">{item.fileName}</td>
                      <td className="p-3 text-gray-600">{item.size}</td>
                      <td className="p-3">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                          {item.qnty}
                        </span>
                      </td>
                      <td className="p-3 text-green-700 font-semibold">
                        {parseFloat(item.price || 0).toLocaleString()}
                      </td>
                      <td className="p-3 text-purple-700 font-bold">
                        {parseFloat(item.money || 0).toLocaleString()}
                      </td>
                      <td className="p-3 text-purple-700 font-bold">
                        {parseFloat(item.receipt || 0).toLocaleString()}
                      </td>
                      <td className="p-3 text-gray-500 text-sm">
                        {item.createdAt ?
                          new Date(item.createdAt)
                            .toLocaleDateString('eng-en')
                            .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
                          : '—'
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Bottom */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default RemainOrderItems;