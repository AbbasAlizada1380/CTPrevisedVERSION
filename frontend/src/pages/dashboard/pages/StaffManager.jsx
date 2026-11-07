import { useEffect, useState } from "react";
import axios from "axios";
import { FaEdit, FaTrash, FaSpinner } from "react-icons/fa";
import { useSelector } from "react-redux";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const initialForm = {
  name: "",
  fatherName: "",
  NIC: "",
  salary: "",
  overTimePerHour: "",
  workingDaysPerWeek: "",
};

const StaffManager = () => {
  const [staffs, setStaffs] = useState([]);
  const { currentUser } = useSelector((state) => state.user);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);

  const fetchStaffs = async () => {
    setTableLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/staff`);
      setStaffs(res.data.staffs || []);
    } catch (error) {
      console.error("Error fetching staffs:", error);
      setStaffs([]);
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffs();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    
    const payload = {
      ...form,
      salary: Number(form.salary),
      overTimePerHour: Number(form.overTimePerHour),
      workingDaysPerWeek: Number(form.workingDaysPerWeek),
    };

    try {
      if (editingId) {
        await axios.put(`${BASE_URL}/staff/${editingId}`, payload);
      } else {
        await axios.post(`${BASE_URL}/staff`, payload);
      }

      setForm(initialForm);
      setEditingId(null);
      fetchStaffs();
    } catch (error) {
      console.error("Error saving staff:", error);
      alert("خطا در ذخیره اطلاعات. لطفاً دوباره تلاش کنید.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (staff) => {
    setForm(staff);
    setEditingId(staff.id);
    // Scroll to form
    document.getElementById("staff-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!confirm("آیا از حذف این کارمند اطمینان دارید؟")) return;
    setTableLoading(true);
    try {
      await axios.delete(`${BASE_URL}/staff/${id}`);
      fetchStaffs();
    } catch (error) {
      console.error("Error deleting staff:", error);
      alert("خطا در حذف کارمند");
      setTableLoading(false);
    }
  };

  const formatDate = (date) =>
    new Date(date)
      .toLocaleDateString("fa-IR")
      .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d));

  // Initial loading screen
  if (tableLoading && staffs.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col items-center justify-center p-6">
        <FaSpinner className="text-5xl text-cyan-800 animate-spin mb-6" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">در حال بارگذاری اطلاعات کارمندان</h2>
        <p className="text-gray-600">لطفاً چند لحظه صبر کنید...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6 space-y-8">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">مدیریت کارمندان</h1>
        <p className="text-gray-600">ثبت و مدیریت اطلاعات کارمندان</p>

        {editingId && (
          <div className="mt-4 p-4 bg-yellow-100 border border-yellow-400 rounded-xl max-w-md mx-auto">
            <div className="flex items-center justify-center gap-2 text-yellow-800">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              <span className="font-semibold">حالت ویرایش – کارمند #{editingId}</span>
            </div>
          </div>
        )}
      </div>

      {/* Form Section */}
      <div id="staff-form" className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Form Header */}
        <div className="bg-gradient-to-r from-cyan-800 to-cyan-600 text-white p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0c-.281.023-.562.045-.843.066a23.518 23.518 0 00-7.86-3.317 8.991 8.991 0 00-5.697 1.641 8.975 8.975 0 013.33 7.007h6.07z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {editingId ? "ویرایش کارمند" : "افزودن کارمند جدید"}
              </h2>
              <p className="text-sm text-white/80">
                {editingId ? "ویرایش اطلاعات کارمند" : "ثبت اطلاعات کارمند جدید"}
              </p>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="text-red-500">*</span> نام
                </label>
                <input
                  required
                  placeholder="نام کارمند"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                  disabled={formLoading}
                />
              </div>

              {/* Father Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="text-red-500">*</span> نام پدر
                </label>
                <input
                  required
                  placeholder="نام پدر کارمند"
                  value={form.fatherName}
                  onChange={(e) => setForm({ ...form, fatherName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                  disabled={formLoading}
                />
              </div>

              {/* NIC Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="text-red-500">*</span> شماره تذکره
                </label>
                <input
                  required
                  placeholder="XXXXX-XXXXXXX-X"
                  value={form.NIC}
                  onChange={(e) => setForm({ ...form, NIC: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                  disabled={formLoading}
                />
              </div>

              {/* Working Days Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="text-red-500">*</span> روز کاری در هفته
                </label>
                <input
                  required
                  type="number"
                  min="1"
                  max="7"
                  placeholder="مثال: 6"
                  value={form.workingDaysPerWeek}
                  onChange={(e) => setForm({ ...form, workingDaysPerWeek: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                  disabled={formLoading}
                />
              </div>
            </div>

            {/* Salary and Overtime Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Salary Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="text-red-500">*</span> معاش هفته وار (افغانی)
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    ؋
                  </div>
                  <input
                    required
                    type="number"
                    value={form.salary}
                    onChange={(e) => setForm({ ...form, salary: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                    disabled={formLoading}
                  />
                </div>
              </div>

              {/* Overtime Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="text-red-500">*</span> اضافه‌کاری / ساعت (افغانی)
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    ؋
                  </div>
                  <input
                    required
                    type="number"
                    value={form.overTimePerHour}
                    onChange={(e) => setForm({ ...form, overTimePerHour: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                    disabled={formLoading}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setForm(initialForm);
                    setEditingId(null);
                  }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium disabled:opacity-50"
                  disabled={formLoading}
                >
                  لغو ویرایش
                </button>
              )}
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-cyan-800 to-cyan-600 text-white rounded-lg hover:from-cyan-900 hover:to-cyan-700 transition font-medium shadow-md disabled:opacity-50 flex items-center gap-2"
                disabled={formLoading}
              >
                {formLoading ? (
                  <>
                    <FaSpinner className="animate-spin h-5 w-5" />
                    در حال پردازش...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>{editingId ? "ذخیره تغییرات" : "ثبت کارمند"}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Table Header */}
        <div className="bg-gradient-to-r from-cyan-800 to-cyan-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold">لیست کارمندان</h2>
                <p className="text-sm text-white/80">
                  {staffs.length} کارمند
                  {tableLoading && " • در حال بارگذاری..."}
                </p>
              </div>
            </div>
            {tableLoading && (
              <div className="flex items-center gap-2 text-sm bg-white/20 px-3 py-1 rounded-full">
                <FaSpinner className="animate-spin" />
                در حال بارگذاری...
              </div>
            )}
          </div>
        </div>

        {/* Table Content */}
        {tableLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <FaSpinner className="text-4xl text-cyan-800 animate-spin mb-4" />
            <p className="text-gray-600">در حال بارگذاری لیست کارمندان...</p>
            <p className="text-sm text-gray-500 mt-2">لطفاً چند لحظه صبر کنید</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-center">
              <thead className="bg-cyan-50 text-cyan-800">
                <tr>
                  <th className="p-3 border-b font-semibold">#</th>
                  <th className="p-3 border-b font-semibold">نام</th>
                  <th className="p-3 border-b font-semibold">نام پدر</th>
                  <th className="p-3 border-b font-semibold">تذکره</th>
                  <th className="p-3 border-b font-semibold">معاش (افغانی)</th>
                  <th className="p-3 border-b font-semibold">روز کاری</th>
                  <th className="p-3 border-b font-semibold">تاریخ ثبت</th>
                  <th className="p-3 border-b font-semibold">عملیات</th>
                </tr>
              </thead>

              <tbody>
                {staffs.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-8">
                      <div className="flex flex-col items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <p className="text-gray-500 text-lg">هیچ کارمندی ثبت نشده است</p>
                        <p className="text-gray-400 text-sm mt-1">برای شروع، کارمند جدیدی اضافه کنید</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  staffs.map((staff, index) => (
                    <tr
                      key={staff.id}
                      className="hover:bg-gray-50 border-b last:border-0 transition-colors"
                    >
                      <td className="p-3 text-gray-600">{staff.id}</td>
                      <td className="p-3 font-medium text-gray-800">{staff.name}</td>
                      <td className="p-3 text-gray-600">{staff.fatherName}</td>
                      <td className="p-3">
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
                          {staff.NIC}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold">
                          {parseFloat(staff.salary || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                          {staff.workingDaysPerWeek} روز
                        </span>
                      </td>
                      <td className="p-3 text-gray-500 text-sm">
                        {staff.createdAt ?
                          new Date(staff.createdAt)
                            .toLocaleDateString('eng-en')
                            .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
                          : '—'
                        }
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(staff)}
                            className="p-2 text-cyan-700 hover:bg-cyan-50 rounded-lg transition disabled:opacity-50"
                            title="ویرایش"
                            disabled={formLoading || tableLoading}
                          >
                            <FaEdit />
                          </button>
                          {currentUser.role === "admin" && (
                            <button
                              onClick={() => handleDelete(staff.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                              title="حذف"
                              disabled={tableLoading}
                            >
                              <FaTrash />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffManager;