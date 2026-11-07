import { useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { FaEdit, FaTrash, FaSpinner } from "react-icons/fa";

const BASE_URL = import.meta.env.VITE_BASE_URL;

export default function MoneyManager() {
  const [moneyList, setMoneyList] = useState([]);
  const [owners, setOwners] = useState([]);
  const { currentUser } = useSelector((state) => state.user);
  const [ownerId, setOwnerId] = useState("");
  const [amount, setAmount] = useState("");
  const [calculated, setCalculated] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({
    calculated: "",
    ownerId: ""
  });
  const [summary, setSummary] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  
  // 🔹 New loading states
  const [initialLoading, setInitialLoading] = useState(true);
  const [ownersLoading, setOwnersLoading] = useState(false);
  const [moneyLoading, setMoneyLoading] = useState(false);

  // 🔹 Fetch owners
  const fetchOwners = async () => {
    setOwnersLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/owner`);
      setOwners(res.data.owners);
    } catch (error) {
      console.error("Error fetching owners:", error);
    } finally {
      setOwnersLoading(false);
    }
  };

  // 🔹 Fetch money records with filters
  const fetchMoney = async () => {
    setMoneyLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.calculated !== "") params.append("calculated", filters.calculated);
      if (filters.ownerId) params.append("ownerId", filters.ownerId);

      const url = `${BASE_URL}/money${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await axios.get(url);
      setMoneyList(res.data.moneyList || []);
      setSummary(res.data.summary || null);
    } catch (error) {
      console.error("Error fetching money:", error);
      setMoneyList([]);
      setSummary(null);
    } finally {
      setMoneyLoading(false);
      setInitialLoading(false);
    }
  };

  // 🔹 Fetch summary statistics
  const fetchSummary = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.ownerId) params.append("ownerId", filters.ownerId);

      const url = `${BASE_URL}/money/summary${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await axios.get(url);
      setSummary(res.data);
    } catch (error) {
      console.error("Error fetching summary:", error);
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      setInitialLoading(true);
      await Promise.all([fetchOwners(), fetchMoney()]);
      setInitialLoading(false);
    };
    fetchInitialData();
  }, [filters]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!ownerId || amount === "") return;

    setLoading(true);
    try {
      const data = {
        ownerId,
        amount,
        calculated
      };

      if (editingId) {
        await axios.put(`${BASE_URL}/money/${editingId}`, data);
      } else {
        await axios.post(`${BASE_URL}/money`, data);
      }

      resetForm();
      fetchMoney();
      setShowForm(false);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "خطا در انجام عملیات");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setOwnerId("");
    setAmount("");
    setCalculated(false);
    setEditingId(null);
  };

  // 🔹 Edit
  const handleEdit = (item) => {
    setEditingId(item.id);
    setOwnerId(item.ownerId);
    setAmount(item.amount);
    setCalculated(item.calculated);
    setShowForm(true);
  };

  // 🔹 Delete
  const handleDelete = async (id) => {
    if (!confirm("آیا از حذف این تراکنش اطمینان دارید؟")) return;
    try {
      await axios.delete(`${BASE_URL}/money/${id}`);
      fetchMoney();
    } catch (err) {
      alert(err.response?.data?.message || "خطا در حذف تراکنش");
    }
  };
  
  // 🔹 Get owner name by ID
  const getOwnerName = (ownerId) => {
    const owner = owners.find(o => o.id == ownerId);
    return owner ? owner.name : "نامشخص";
  };

  const totalAmount = moneyList.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);

  // 🔹 Initial loading screen
  if (initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]" dir="rtl">
        <FaSpinner className="text-4xl text-cyan-800 animate-spin mb-4" />
        <p className="text-gray-600">در حال بارگذاری اطلاعات تراکنش‌ها...</p>
        <p className="text-sm text-gray-500 mt-2">لطفاً کمی صبر کنید</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">مدیریت تراکنش‌ها</h2>

        <div className="flex gap-2">
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-cyan-500 text-white rounded-lg hover:from-cyan-700 hover:to-cyan-600 transition-all flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            افزودن تراکنش
          </button>
        </div>
      </div>

      {/* Summary Panel */}
      {showSummary && summary && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-lg p-6 animate-fadeIn">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">مجموع مبلغ</p>
                  <p className="text-2xl font-bold text-green-600">
                    {summary.totalAmount?.toLocaleString() || 0} <span className="text-sm">افغانی</span>
                  </p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">تعداد کل تراکنش‌ها</p>
                  <p className="text-2xl font-bold text-blue-600">{summary.totalRecords || 0}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">تراکنش‌های محاسبه‌ای</p>
                  <p className="text-2xl font-bold text-purple-600">{summary.calculatedRecords || 0}</p>
                </div>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">تراکنش‌های دستی</p>
                  <p className="text-2xl font-bold text-amber-600">{summary.manualRecords || 0}</p>
                </div>
                <div className="p-2 bg-amber-100 rounded-lg">
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* فرم */}
      {showForm && (
        <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl shadow-lg p-6 animate-fadeIn">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-cyan-100 rounded-lg">
              <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                {editingId ? "ویرایش تراکنش" : "افزودن تراکنش جدید"}
              </h3>
              <p className="text-sm text-gray-600">
                {editingId ? "جزئیات تراکنش را به‌روزرسانی کنید" : "اطلاعات تراکنش جدید را وارد کنید"}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  مالک
                </label>
                {ownersLoading ? (
                  <div className="flex items-center justify-center h-12 bg-gray-100 rounded-lg">
                    <FaSpinner className="animate-spin text-gray-400" />
                  </div>
                ) : (
                  <select
                    value={ownerId}
                    onChange={(e) => setOwnerId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors bg-white"
                    required
                  >
                    <option value="">انتخاب مالک</option>
                    {owners.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  مبلغ (افغانی)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg pr-10 pl-4 py-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors text-left"
                    required
                    dir="ltr"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className={`px-6 py-3 font-medium rounded-lg transition-all flex items-center gap-2
    ${loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 text-white"
                  }`}
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin h-5 w-5 text-white" />
                    در حال ذخیره...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    {editingId ? "به‌روزرسانی تراکنش" : "افزودن تراکنش"}
                  </>
                )}
              </button>

              {(editingId || showForm) && (
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setShowForm(false);
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-gray-400 to-gray-300 text-gray-800 font-medium rounded-lg hover:from-gray-500 hover:to-gray-400 transition-all"
                >
                  لغو
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* جدول */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h4 className="font-semibold text-gray-800">لیست تراکنش‌ها</h4>
              <p className="text-sm text-gray-600">
                نمایش {moneyList.length} تراکنش - مجموع: {totalAmount.toLocaleString()} افغانی
              </p>
            </div>
          </div>
        </div>

        {/* Loading indicator for money list */}
        {moneyLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <FaSpinner className="text-3xl text-cyan-800 animate-spin mb-4" />
            <p className="text-gray-600">در حال بارگذاری تراکنش‌ها...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-right py-4 px-6 font-semibold text-gray-700">مالک</th>
                  <th className="text-right py-4 px-6 font-semibold text-gray-700">مبلغ</th>
                  <th className="text-right py-4 px-6 font-semibold text-gray-700">تاریخ</th>
                  <th className="text-right py-4 px-6 font-semibold text-gray-700">عملیات</th>
                </tr>
              </thead>

              <tbody>
                {moneyList.length > 0 ? (
                  moneyList.map((item) => (
                    <tr
                      key={item.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${item.calculated ? 'bg-blue-50/50' : ''
                        }`}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.calculated ? 'bg-blue-100' : 'bg-cyan-100'
                            }`}>
                            <span className={`font-semibold ${item.calculated ? 'text-blue-600' : 'text-cyan-600'
                              }`}>
                              {item.owner?.name?.charAt(0) || "O"}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{item.owner?.name || getOwnerName(item.ownerId)}</p>
                            <p className="text-xs text-gray-500">شناسه: {item.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2" dir="ltr">
                          <span className="text-gray-700 font-bold">
                            {parseFloat(item.amount || 0).toLocaleString()}
                          </span>
                          <span className="text-xs text-gray-500">افغانی</span>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="text-gray-600" dir="rtl">
                          {new Date(item.createdAt).toLocaleDateString('eng-en', {
                            year: 'numeric',
                            month: 'numeric',
                            day: 'numeric'
                          })}
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(item.createdAt).toLocaleTimeString('fa-IR-u-nu-latn', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {currentUser.role == "admin" ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-2 text-cyan-700 hover:bg-cyan-50 rounded-lg transition-colors"
                              title="ویرایش"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="حذف"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        ) : "--"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="p-4 bg-gray-100 rounded-full mb-4">
                          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-600 mb-2">هیچ تراکنشی یافت نشد</h3>
                        <p className="text-gray-500 mb-4">با افزودن اولین تراکنش شروع کنید</p>
                        <button
                          onClick={() => setShowForm(true)}
                          className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-cyan-500 text-white rounded-lg hover:from-cyan-700 hover:to-cyan-600 transition-all"
                        >
                          <span className="flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                            </svg>
                            افزودن اولین تراکنش
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