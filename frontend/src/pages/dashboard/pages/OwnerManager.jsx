import { useEffect, useState } from "react";
import axios from "axios";
import { FaSpinner } from "react-icons/fa";

const BASE_URL = import.meta.env.VITE_BASE_URL;

export default function OwnerManager() {
  const [owners, setOwners] = useState([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);

  const fetchOwners = async () => {
    setTableLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/owner`);
      setOwners(res.data.owners || []);
    } catch (err) {
      console.error("Error fetching owners:", err);
      setOwners([]);
    } finally {
      setTableLoading(false);
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchOwners();
  }, []);

  // ✅ Create or Update
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      if (editingId) {
        await axios.put(`${BASE_URL}/owner/${editingId}`, { name });
      } else {
        await axios.post(`${BASE_URL}/owner/`, { name });
      }

      setName("");
      setEditingId(null);
      fetchOwners();
      setShowForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Activate / Deactivate
  const toggleStatus = async (id, isActive) => {
    setTableLoading(true);
    try {
      await axios.put(
        `${BASE_URL}/owner/${id}/${isActive ? "deactivate" : "activate"}`
      );
      fetchOwners();
    } catch (err) {
      console.error(err);
      setTableLoading(false);
    }
  };

  // ✅ Delete
  const deleteOwner = async (id) => {
    if (!confirm("آیا از حذف این مالک اطمینان دارید؟")) return;
    setTableLoading(true);
    try {
      await axios.delete(`${BASE_URL}/owner/${id}`);
      fetchOwners();
    } catch (err) {
      console.error(err);
      setTableLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setEditingId(null);
    setShowForm(false);
  };

  const activeOwners = owners.filter(owner => owner.isActive).length;
  const inactiveOwners = owners.filter(owner => !owner.isActive).length;

  // Initial loading state
  if (initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]" dir="rtl">
        <FaSpinner className="text-4xl text-cyan-800 animate-spin mb-4" />
        <p className="text-gray-600">در حال بارگذاری اطلاعات مالکان...</p>
        <p className="text-sm text-gray-500 mt-2">لطفاً کمی صبر کنید</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* هدر با دکمه افزودن */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800">مدیریت مالکان</h2>
          <p className="text-sm text-gray-600">مدیریت مالکان کسب‌وکار و وضعیت آن‌ها</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            if (editingId) resetForm();
          }}
          className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${showForm
              ? "bg-gradient-to-r from-gray-600 to-gray-500 text-white"
              : "bg-gradient-to-r from-cyan-600 to-cyan-500 text-white hover:from-cyan-700 hover:to-cyan-600"
            }`}
        >
          {showForm ? (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
              بستن فرم
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
              </svg>
              افزودن مالک جدید
            </>
          )}
        </button>
      </div>

      {/* فرم - بهبود یافته */}
      {showForm && (
        <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl shadow-lg p-6 animate-fadeIn">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-cyan-100 rounded-lg">
              <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                {editingId ? "ویرایش مالک" : "افزودن مالک جدید"}
              </h3>
              <p className="text-sm text-gray-600">
                {editingId ? "جزئیات مالک را به‌روزرسانی کنید" : "اطلاعات مالک جدید را وارد کنید"}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نام مالک
              </label>
              <div className="relative">
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="نام مالک را وارد کنید"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg pr-12 pl-4 py-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-cyan-500 text-white font-medium rounded-lg hover:from-cyan-700 hover:to-cyan-600 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin h-5 w-5 text-white" />
                    در حال پردازش...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    {editingId ? "به‌روزرسانی مالک" : "افزودن مالک"}
                  </>
                )}
              </button>

              {(editingId || showForm) && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 bg-gradient-to-r from-gray-400 to-gray-300 text-gray-800 font-medium rounded-lg hover:from-gray-500 hover:to-gray-400 transition-all"
                >
                  لغو
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* جدول - با وضعیت لودینگ */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
        {/* Table header with stats */}
        <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h4 className="font-semibold text-gray-800">لیست مالکان</h4>
              <p className="text-sm text-gray-600">
                نمایش {owners.length} مالک | فعال: {activeOwners} | غیرفعال: {inactiveOwners}
              </p>
            </div>
            {tableLoading && (
              <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                <FaSpinner className="animate-spin" />
                در حال به‌روزرسانی...
              </div>
            )}
          </div>
        </div>

        {/* Table loading state */}
        {tableLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <FaSpinner className="text-3xl text-cyan-800 animate-spin mb-4" />
            <p className="text-gray-600">در حال بارگذاری اطلاعات مالکان...</p>
            <p className="text-sm text-gray-500 mt-2">لطفاً منتظر بمانید</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <th className="text-right py-4 px-6 font-semibold text-gray-700">مالک</th>
                  <th className="text-right py-4 px-6 font-semibold text-gray-700">وضعیت</th>
                  <th className="text-right py-4 px-6 font-semibold text-gray-700">عملیات</th>
                </tr>
              </thead>

              <tbody>
                {owners.length > 0 ? (
                  owners.map((owner) => (
                    <tr
                      key={owner.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${owner.isActive
                              ? "bg-gradient-to-r from-cyan-100 to-cyan-50 border border-cyan-200"
                              : "bg-gradient-to-r from-gray-100 to-gray-50 border border-gray-200"
                            }`}>
                            <span className={`text-lg font-bold ${owner.isActive ? "text-cyan-600" : "text-gray-500"
                              }`}>
                              {owner.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{owner.name}</p>
                            <p className="text-xs text-gray-500">شناسه: {owner.id}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${owner.isActive
                              ? "bg-cyan-100 text-cyan-800"
                              : "bg-red-100 text-red-800"
                            }`}>
                            <span className={`w-2 h-2 rounded-full ml-2 ${owner.isActive ? "bg-cyan-500" : "bg-red-500"
                              }`}></span>
                            {owner.isActive ? "فعال" : "غیرفعال"}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => deleteOwner(owner.id)}
                            className="p-2 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 text-red-700 rounded-lg hover:from-red-100 hover:to-red-200 transition-all disabled:opacity-50"
                            title="حذف"
                            disabled={tableLoading}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                          </button>

                          <button
                            onClick={() => toggleStatus(owner.id, owner.isActive)}
                            className={`p-2 rounded-lg border transition-all disabled:opacity-50 ${owner.isActive
                                ? "bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200 text-orange-700 hover:from-orange-100 hover:to-orange-200"
                                : "bg-gradient-to-r from-cyan-50 to-cyan-100 border-cyan-200 text-cyan-700 hover:from-cyan-100 hover:to-cyan-200"
                              }`}
                            title={owner.isActive ? "غیرفعال کردن" : "فعال کردن"}
                            disabled={tableLoading}
                          >
                            {owner.isActive ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"></path>
                              </svg>
                            )}
                          </button>

                          <button
                            onClick={() => {
                              setEditingId(owner.id);
                              setName(owner.name);
                              setShowForm(true);
                            }}
                            className="p-2 bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 text-yellow-700 rounded-lg hover:from-yellow-100 hover:to-yellow-200 transition-all disabled:opacity-50"
                            title="ویرایش"
                            disabled={tableLoading}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="p-4 bg-gray-100 rounded-full mb-4">
                          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-600 mb-2">هیچ مالکی یافت نشد</h3>
                        <p className="text-gray-500 mb-4">با افزودن اولین مالک شروع کنید</p>
                        <button
                          onClick={() => setShowForm(true)}
                          className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-cyan-500 text-white rounded-lg hover:from-cyan-700 hover:to-cyan-600 transition-all"
                        >
                          <span className="flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
                            </svg>
                            افزودن اولین مالک
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}