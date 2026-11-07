// SellersList.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import Pagination from "../pagination/Pagination";
import { FaUsers, FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import PaySeller from "./PaySeller";
import PaysManagement from "./PaysManagement";

const BASE_URL = import.meta.env.VITE_BASE_URL;
const limit = 10;

const SellersList = () => {
  const [sellers, setSellers] = useState([]);
  const { currentUser } = useSelector((state) => state.user);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null); // for toggle button loading

  const [form, setForm] = useState({
    fullname: "",
    phoneNumber: "",
    isActive: true,
  });

  /* ======================
     Fetch Sellers
  ====================== */
  const fetchSellers = async (page = 1) => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/seller`, {
        params: { page, limit },
      });

      // Adjust based on your API response structure
      setSellers(res.data.data || []);
      setCurrentPage(res.data.pagination?.currentPage || page);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch (err) {
      console.error("Error fetching sellers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers(currentPage);
  }, [currentPage]);

  /* ======================
     Handle Add / Edit
  ====================== */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    try {
      setSubmitting(true);
      if (editingId) {
        await axios.put(`${BASE_URL}/seller/${editingId}`, form);
      } else {
        await axios.post(`${BASE_URL}/seller`, form);
      }
      resetForm();
      fetchSellers(currentPage);
    } catch (err) {
      console.error(err);
      alert("خطا در ذخیره‌سازی فروشنده");
    } finally {
      setSubmitting(false);
    }
  };

  /* ======================
     Toggle Active/Inactive
  ====================== */
  const handleToggleActive = async (seller) => {
    if (!window.confirm(`آیا وضعیت فروشنده "${seller.fullname}" را تغییر دهید؟`))
      return;

    setTogglingId(seller.id);
    try {
      await axios.put(`${BASE_URL}/seller/${seller.id}`, {
        ...seller,
        isActive: !seller.isActive,
      });
      fetchSellers(currentPage);
    } catch (err) {
      console.error(err);
      alert("خطا در تغییر وضعیت");
    } finally {
      setTogglingId(null);
    }
  };

  /* ======================
     Edit
  ====================== */
  const handleEdit = (seller) => {
    setEditingId(seller.id);
    setForm({
      fullname: seller.fullname,
      phoneNumber: seller.phoneNumber || "",
      isActive: seller.isActive,
    });
    setIsModalOpen(true);
  };

  /* ======================
     Delete (Hard Delete)
  ====================== */
  const handleDelete = async (id, name) => {
    if (!window.confirm(`آیا فروشنده "${name}" را برای همیشه حذف کنید؟`)) return;
    try {
      await axios.delete(`${BASE_URL}/seller/${id}`);
      fetchSellers(currentPage);
    } catch (err) {
      console.error(err);
      alert("خطا در حذف فروشنده");
    }
  };

  /* ======================
     Reset Form & Close Modal
  ====================== */
  const resetForm = () => {
    setForm({ fullname: "", phoneNumber: "", isActive: true });
    setEditingId(null);
    setIsModalOpen(false);
  };

  /* ======================
     Render
  ====================== */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6 space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          مدیریت فروشندگان
        </h1>
        <p className="text-gray-600">مدیریت اطلاعات فروشندگان</p>

        {editingId && (
          <div className="mt-4 p-4 bg-yellow-100 border border-yellow-400 rounded-xl">
            <div className="flex items-center justify-center gap-2 text-yellow-800">
              <FaEdit />
              <span className="font-semibold">
                حالت ویرایش – فروشنده #{editingId}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Sellers Table */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-100">
        {/* Table Header */}
        <div className="flex bg-gray-200 items-center justify-between rounded-t-md p-6">
          <div className="flex items-center gap-x-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <FaUsers className="text-cyan-800 text-xl" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              لیست فروشندگان
            </h2>
          </div>

          {currentUser?.role === "admin" && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-cyan-800 text-white px-4 py-2 rounded-lg hover:bg-cyan-900"
            >
              <FaPlus />
              افزودن فروشنده
            </button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-center border border-gray-300">
            <thead className="bg-cyan-800 text-white">
              <tr>
                <th className="border px-4 py-2">#</th>
                <th className="border px-4 py-2">نام کامل</th>
                <th className="border px-4 py-2">شماره تماس</th>
                <th className="border px-4 py-2">وضعیت</th>
                <th className="border px-4 py-2">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-4">
                    در حال بارگذاری...
                  </td>
                </tr>
              ) : sellers.length ? (
                sellers.map((seller, index) => (
                  <tr key={seller.id} className="hover:bg-gray-50">
                    <td className="border px-4 py-2">{seller.id}</td>
                    <td className="border px-4 py-2">{seller.fullname}</td>
                    <td className="border px-4 py-2">
                      {seller.phoneNumber || "—"}
                    </td>
                    <td className="border px-4 py-2">
                      {seller.isActive ? (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                          فعال
                        </span>
                      ) : (
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm">
                          غیرفعال
                        </span>
                      )}
                    </td>
                    <td className="border px-4 py-2">
                      {currentUser?.role === "admin" ? (
                        <div className="flex justify-center gap-2">
                          {/* Edit button */}
                          <button
                            onClick={() => handleEdit(seller)}
                            className="h-8 w-8 flex items-center justify-center border border-cyan-800 rounded-md hover:scale-105"
                            title="ویرایش"
                          >
                            <FaEdit className="text-cyan-800" />
                          </button>
                          {/* Toggle Active/Inactive button */}
                          <button
                            onClick={() => handleToggleActive(seller)}
                            disabled={togglingId === seller.id}
                            className={`px-2 py-1 rounded-md text-xs font-medium ${
                              seller.isActive
                                ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                                : "bg-green-100 text-green-700 hover:bg-green-200"
                            } disabled:opacity-50`}
                          >
                            {togglingId === seller.id
                              ? "..."
                              : seller.isActive
                              ? "غیرفعال کردن"
                              : "فعال کردن"}
                          </button>
                          {/* Delete button */}
                          <button
                            onClick={() => handleDelete(seller.id, seller.fullname)}
                            className="h-8 w-8 flex items-center justify-center border border-red-600 rounded-md hover:scale-105"
                            title="حذف دائمی"
                          >
                            <FaTrash className="text-red-600" />
                          </button>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-4 text-gray-500">
                    هیچ فروشنده‌ای وجود ندارد
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <form
            onSubmit={handleSubmit}
            className="bg-white p-6 rounded-lg w-[400px]"
          >
            <h3 className="text-lg font-bold mb-4">
              {editingId ? "ویرایش فروشنده" : "افزودن فروشنده"}
            </h3>

            <input
              required
              placeholder="نام کامل"
              value={form.fullname}
              onChange={(e) => setForm({ ...form, fullname: e.target.value })}
              className="w-full border p-2 rounded mb-3"
            />

            <input
              placeholder="شماره تماس"
              value={form.phoneNumber}
              onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
              className="w-full border p-2 rounded mb-3"
            />

            <label className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              فعال
            </label>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border rounded"
              >
                لغو
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-cyan-800 text-white rounded flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? "در حال ذخیره..." : "ذخیره"}
              </button>
            </div>
          </form>
        </div>
      )}
      <PaySeller />
      <PaysManagement/>
    </div>
  );
};

export default SellersList;