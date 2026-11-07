// PaysManagement.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { FaMoneyBillWave, FaPlus, FaEdit, FaTrash, FaTimes, FaCheckCircle, FaSpinner, FaSearch } from "react-icons/fa";
import Pagination from "../pagination/Pagination";
import DatePayDownload from "./report/DatePayDownload;";

const BASE_URL = import.meta.env.VITE_BASE_URL;
const limit = 20;

const PaysManagement = () => {
  const [pays, setPays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Filters
  const [filterSeller, setFilterSeller] = useState("");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });

  // Form state
  const [form, setForm] = useState({
    seller: "",
    amount: "",
    description: "",
  });

  // Fetch pays with pagination & filters
  const fetchPays = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit };
      if (filterSeller) params.seller = filterSeller;
      if (dateRange.from && dateRange.to) {
        params.from = dateRange.from;
        params.to = dateRange.to;
      }
      const response = await axios.get(`${BASE_URL}/pays`, { params });
      if (response.data.success) {
        setPays(response.data.data);
        setCurrentPage(response.data.page);
        setTotalPages(response.data.totalPages);
        setTotalRecords(response.data.totalRecords);
      } else {
        setError("خطا در دریافت اطلاعات");
      }
    } catch (err) {
      setError(err.response?.data?.message || "خطا در ارتباط با سرور");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPays(currentPage);
  }, [currentPage, filterSeller, dateRange.from, dateRange.to]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterSeller, dateRange.from, dateRange.to]);

  // Open modal for create/edit
  const openModal = (pay = null) => {
    if (pay) {
      setEditingId(pay.id);
      setForm({
        seller: pay.seller,
        amount: pay.amount,
        description: pay.description || "",
      });
    } else {
      setEditingId(null);
      setForm({ seller: "", amount: "", description: "" });
    }
    setIsModalOpen(true);
    setError(null);
    setSuccess("");
  };

  // Handle form submit (create or update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.seller || !form.amount || parseFloat(form.amount) <= 0) {
      setError("لطفاً فروشنده و مبلغ معتبر وارد کنید");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (editingId) {
        await axios.put(`${BASE_URL}/pays/${editingId}`, {
          seller: form.seller,
          amount: parseFloat(form.amount),
          description: form.description,
        });
        setSuccess("پرداخت با موفقیت ویرایش شد");
      } else {
        await axios.post(`${BASE_URL}/pays`, {
          sellerId: form.seller,
          amount: parseFloat(form.amount),
          description: form.description,
        });
        setSuccess("پرداخت جدید با موفقیت ثبت شد");
      }
      setIsModalOpen(false);
      fetchPays(currentPage);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "خطا در ذخیره‌سازی");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete pay
  const handleDelete = async (id, sellerName) => {
    if (!window.confirm(`آیا پرداخت مربوط به فروشنده "${sellerName}" را حذف کنید؟`)) return;
    try {
      await axios.delete(`${BASE_URL}/pays/${id}`);
      setSuccess("پرداخت با موفقیت حذف شد");
      fetchPays(currentPage);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "خطا در حذف");
      console.error(err);
    }
  };

  // Format number with thousand separators
  const formatNumber = (num) => {
    return parseFloat(num).toLocaleString("fa-IR");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6 space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">مدیریت پرداخت‌ها</h1>
        <p className="text-gray-600">لیست تمام پرداخت‌های ثبت‌شده توسط فروشندگان</p>
      </div>

      {/* Filters & Add Button */}
      <div className="bg-white rounded-lg shadow-md p-4 flex flex-wrap justify-between items-end gap-4">
        <div className="flex flex-wrap gap-4">
          <DatePayDownload /> </div>
        <button
          onClick={() => openModal()}
          className="bg-cyan-800 hover:bg-cyan-900 text-white px-4 py-2 rounded-md flex items-center gap-2"
        >
          <FaPlus /> ثبت پرداخت جدید
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded flex items-center gap-2">
          <FaCheckCircle /> {success}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-center border border-gray-300">
            <thead className="bg-cyan-800 text-white">
              <tr>
                <th className="border px-4 py-2">#</th>
                <th className="border px-4 py-2">فروشنده</th>
                <th className="border px-4 py-2">مبلغ (افغانی)</th>
                <th className="border px-4 py-2">توضیحات</th>
                <th className="border px-4 py-2">تاریخ ثبت</th>
                <th className="border px-4 py-2">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-4 text-gray-500">در حال بارگذاری...</td>
                </tr>
              ) : pays.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-4 text-gray-500">هیچ پرداختی یافت نشد.</td>
                </tr>
              ) : (
                pays.map((pay, idx) => (
                  <tr key={pay.id} className="hover:bg-gray-50">
                    <td className="border px-4 py-2">{idx + 1 + (currentPage - 1) * limit}</td>
                    <td className="border px-4 py-2">{pay.sellerInfo.fullname}</td>
                    <td className="border px-4 py-2 font-bold text-green-700">{pay.amount}</td>
                    <td className="border px-4 py-2 max-w-xs truncate">{pay.description || "—"}</td>
                    <td className="border px-4 py-2">{new Date(pay.createdAt).toLocaleDateString("eng-en")}</td>
                    <td className="border px-4 py-2">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => openModal(pay)}
                          className="text-cyan-800 hover:text-cyan-900"
                          title="ویرایش"
                        >
                          <FaEdit />
                        </button>
                        {/* <button
                          onClick={() => handleDelete(pay.id, pay.seller)}
                          className="text-red-600 hover:text-red-700"
                          title="حذف"
                        >
                          <FaTrash />
                        </button> */}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-bold text-gray-800">
                {editingId ? "ویرایش پرداخت" : "ثبت پرداخت جدید"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-gray-700 mb-1">شناسه فروشنده *</label>
                <input
                  type="number"
                  required
                  value={form.seller}
                  onChange={(e) => setForm({ ...form, seller: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="مثال: 5"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">مبلغ (تومان) *</label>
                <input
                  type="number"
                  step="1000"
                  required
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="مبلغ پرداختی"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">توضیحات</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  rows="3"
                  placeholder="اختیاری"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                  disabled={submitting}
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-cyan-800 text-white rounded hover:bg-cyan-900 disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />}
                  {submitting ? "در حال ذخیره..." : "ذخیره"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaysManagement;