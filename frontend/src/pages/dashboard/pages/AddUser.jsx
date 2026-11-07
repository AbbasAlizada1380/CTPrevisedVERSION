import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { createUser, getUsers } from "../services/UserServices";
import { LuUsers } from "react-icons/lu";

const AddUser = () => {
  const [form, setForm] = useState({
    fullname: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
  });
  const [roles] = useState([{ id: 1, name: "designer" }, { id: 2, name: "FinancialManager" }]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Fetch users on component mount
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await getUsers();
      setUsers(res || []);
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "خطا در دریافت اطلاعات",
        text: "در دریافت لیست کاربران مشکلی پیش آمده است.",
        confirmButtonText: "باشه",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      Swal.fire({
        icon: "warning",
        title: "رمز عبور مطابقت ندارد!",
        text: "لطفاً رمز عبور و تکرار آن را یکسان وارد کنید.",
        confirmButtonText: "باشه",
      });
      return;
    }

    try {
      const newUser = await createUser({
        fullname: form.fullname,
        email: form.email,
        password: form.password,
        role: form.role,
      });

      Swal.fire({
        icon: "success",
        title: "عملیات موفق",
        text: `کاربر ${newUser.fullname} با موفقیت ثبت شد.`,
        confirmButtonText: "باشه",
        timer: 3000,
        showConfirmButton: false,
      });

      // Reset the form
      setForm({
        fullname: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "",
      });

      // Refresh user list
      fetchUsers();
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "خطا در ثبت کاربر",
        text:
          err.response?.data?.message || err.message || "مشکلی پیش آمده است.",
      });
    }
  };

  // Filter users based on search term and role filter
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === "all" || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  // Get unique roles for filter dropdown
  const uniqueRoles = [
    "all",
    ...new Set(users.map((user) => user.role).filter((role) => role)),
  ];

  const clearFilters = () => {
    setSearchTerm("");
    setRoleFilter("all");
  };

  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            مدیریت کاربران
          </h1>
          <p className="text-gray-600">افزودن کاربر جدید و مدیریت دسترسی‌ها</p>
        </div>

        <div className="gap-8">
          {/* Left Column - Add User Form */}
          <div className="bg-gray-200 max-w-4xl mx-auto rounded-lg shadow-lg p-6 transition-all duration-300 border border-white/20">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-cyan-800"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800">
                افزودن کاربر جدید
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Fullname */}
              <div className="grid grid-cols-2 gap-5">
                <div className="relative group">
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                    نام کامل
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="fullname"
                      value={form.fullname}
                      onChange={handleChange}
                      className="w-full px-4 py-3 pr-5 border border-gray-300 rounded-md focus:ring-1 focus:ring-cyan-800 focus:outline-none transition-all duration-200 bg-gray-50 text-right group-hover:bg-white"
                      placeholder="نام و نام خانوادگی"
                      required
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div className="relative group">
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                    آدرس ایمیل
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 pr-5 border border-gray-300 rounded-md focus:ring-1 focus:ring-cyan-800 focus:outline-none transition-all duration-200 bg-gray-50 text-right group-hover:bg-white"
                      placeholder="example@email.com"
                      required
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Password */}
                <div className="relative group">
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                    رمز عبور
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      className="w-full px-4 py-3 pr-5 border border-gray-300 rounded-md focus:ring-1 focus:ring-cyan-800 focus:outline-none transition-all duration-200 bg-gray-50 text-right group-hover:bg-white"
                      placeholder="••••••••"
                      required
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="relative group">
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                    تکرار رمز عبور
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      name="confirmPassword"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      className="w-full px-4 py-3 pr-5 border border-gray-300 rounded-md focus:ring-1 focus:ring-cyan-800 focus:outline-none transition-all duration-200 bg-gray-50 text-right group-hover:bg-white"
                      placeholder="••••••••"
                      required
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Role */}
                <div className="relative group col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                    نقش کاربری
                  </label>
                  <div className="relative">
                    <select
                      name="role"
                      value={form.role}
                      onChange={handleChange}
                      className="w-full px-4 py-3 pr-5 border border-gray-300 rounded-md focus:ring-1 focus:ring-cyan-800 focus:outline-none transition-all duration-200 bg-gray-50 text-right group-hover:bg-white"
                      required
                    >
                      <option value="">انتخاب نقش کاربری</option>
                      {roles.map((r) => (
                        <option key={r.id} value={r.name}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-center">
                <button
                  type="submit"
                  className="bg-cyan-800 px-5 text-white py-3 rounded-xl font-semibold text-lg hover:bg-cyan-700 transform hover:scale-105 transition-all duration-200 shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  افزودن کاربر
                </button>
              </div>
            </form>
          </div>

          {/* Right Column - Users List */}
          <div className="mt-5 p-6 transition-all duration-300 border-white/20">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <LuUsers size={24} className="text-cyan-800" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">
                  لیست کاربران
                </h2>
                <span className="bg-blue-100 text-cyan-800 text-sm px-3 py-1 rounded-full font-medium">
                  {filteredUsers.length} از {users.length} کاربر
                </span>
              </div>

              {/* Refresh Button */}
              <button
                onClick={fetchUsers}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-800 text-white rounded-lg hover:bg-cyan-700 transition-colors duration-200"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                بروزرسانی
              </button>
            </div>

            {/* Search and Filter Section */}
            <div className="bg-gray-100 p-4 rounded-lg mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search Input */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                    جستجوی کاربران
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-md focus:ring-1 focus:ring-cyan-800 focus:outline-none transition-all duration-200 bg-white text-right"
                      placeholder="جستجو بر اساس نام، ایمیل یا نقش..."
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        className="absolute left-10 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Role Filter */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                    فیلتر بر اساس نقش
                  </label>
                  <div className="relative">
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-md focus:ring-1 focus:ring-cyan-800 focus:outline-none transition-all duration-200 bg-white text-right appearance-none"
                    >
                      <option value="all">همه نقش‌ها</option>
                      {uniqueRoles
                        .filter((role) => role !== "all")
                        .map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                    </select>
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Clear Filters Button */}
                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    disabled={!searchTerm && roleFilter === "all"}
                    className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    پاک کردن فیلترها
                  </button>
                </div>
              </div>

              {/* Active Filters Info */}
              {(searchTerm || roleFilter !== "all") && (
                <div className="mt-3 flex items-center gap-2 text-sm text-cyan-800">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>
                    فیلتر فعال:
                    {searchTerm && ` جستجو: "${searchTerm}"`}
                    {searchTerm && roleFilter !== "all" && " | "}
                    {roleFilter !== "all" && ` نقش: ${roleFilter}`}
                  </span>
                </div>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-800"></div>
              </div>
            ) : (
              <div className="overflow-hidden border border-gray-200 rounded-lg">
                <table className="w-full">
                  <thead className="bg-cyan-800 text-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-right text-sm font-semibold border-b border-gray-200">
                        نمبر
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold border-b border-gray-200">
                        نام کامل
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold border-b border-gray-200">
                        ایمیل
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold border-b border-gray-200">
                        نقش
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user, index) => (
                        <tr
                          key={user.id}
                          className="hover:bg-gray-100 bg-gray-200 border-b border-gray-100 transition-colors duration-150"
                        >
                          <td className="px-6 py-4 text-right text-sm text-gray-600">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 text-right text-sm text-gray-800 font-medium">
                            {user.fullname}
                          </td>
                          <td className="px-6 py-4 text-right text-sm text-gray-600">
                            {user.email}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-cyan-800 text-gray-50">
                              {user.role}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr className="border-b">
                        <td colSpan="4" className="px-6 py-12 text-center">
                          <div className="text-gray-500 text-sm">
                            <svg
                              className="w-12 h-12 mx-auto text-gray-300 mb-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                              />
                            </svg>
                            {searchTerm || roleFilter !== "all"
                              ? "هیچ کاربری با معیارهای جستجو مطابقت ندارد"
                              : "کاربری یافت نشد"}
                          </div>
                          {(searchTerm || roleFilter !== "all") && (
                            <button
                              onClick={clearFilters}
                              className="mt-2 px-4 py-2 text-cyan-800 hover:text-cyan-700 text-sm font-medium"
                            >
                              پاک کردن فیلترها
                            </button>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddUser;
