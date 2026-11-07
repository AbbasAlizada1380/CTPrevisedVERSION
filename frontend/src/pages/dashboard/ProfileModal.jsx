import React, { useState, useEffect } from "react";
import { FaTimes, FaSpinner } from "react-icons/fa";
import axios from "axios";
import { toast } from "react-toastify";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const ProfileModal = ({ isOpen, onClose, currentUser }) => {
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    newPassword: "",
    rePassword: "",
    oldPassword: "",
  });
  const [loading, setLoading] = useState(false);

  // Initialize form when modal opens
  useEffect(() => {
    if (currentUser) {
      setFormData({
        fullname: currentUser.fullname || "",
        email: currentUser.email || "",
        newPassword: "",
        rePassword: "",
        oldPassword: "",
      });
    }
  }, [currentUser, isOpen]);

  // Handle form changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    const { fullname, email, newPassword, rePassword, oldPassword } = formData;

    // Validate password match
    if (newPassword && newPassword !== rePassword) {
      toast.error("رمزهای جدید مطابقت ندارند", {
        className: "toastify-persian",
        position: "top-left",
      });
      return;
    }

    if (!oldPassword) {
      toast.error("رمز فعلی الزامی است", {
        className: "toastify-persian",
        position: "top-left",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.patch(
        `${BASE_URL}/users/${currentUser.id}`,
        {
          fullname,
          email,
          currentPassword: oldPassword,
          newPassword,
        },
        { withCredentials: true }
      );

      toast.success(response.data.message || "پروفایل با موفقیت ویرایش شد", {
        className: "toastify-persian",
        position: "top-left",
      });

      setTimeout(onClose, 1500);
    } catch (error) {
      console.error("Update error:", error);
      toast.error(
        error.response?.data?.message || "خطا در به‌روزرسانی پروفایل",
        {
          className: "toastify-persian",
          position: "top-left",
        }
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !currentUser) return null;

  return (
    <div
      className="fixed inset-0 bg-white/10 backdrop-blur-sm z-40 flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div
        dir="rtl"
        className="bg-white/80 backdrop-blur-lg rounded-xl shadow-2xl p-6 w-full max-w-md relative
                 border border-white/20 transition-all duration-300 hover:shadow-3xl
                 font-[IRANSans] text-right"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 left-3 p-2 bg-white/80 backdrop-blur-sm rounded-full
                   text-gray-600 hover:text-gray-900 hover:bg-white/90 shadow-sm
                   transition-all duration-200"
        >
          <FaTimes />
        </button>

        <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b border-white/30 pb-2">
          ویرایش پروفایل
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700/90 mb-1">
              نام کامل
            </label>
            <input
              type="text"
              id="fullname"
              value={formData.fullname}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-200/80 rounded-lg shadow-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50
                       bg-white/70 backdrop-blur-sm transition-all duration-200"
              placeholder="نام خود را وارد کنید"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700/90 mb-1">
              ایمیل
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-200/80 rounded-lg shadow-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50
                       bg-white/70 backdrop-blur-sm transition-all duration-200"
              placeholder="ایمیل خود را وارد کنید"
            />
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700/90 mb-1">
              رمز جدید
            </label>
            <input
              type="password"
              id="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-200/80 rounded-lg shadow-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50
                       bg-white/70 backdrop-blur-sm transition-all duration-200"
            />
          </div>

          {/* Re-enter Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700/90 mb-1">
              تکرار رمز جدید
            </label>
            <input
              type="password"
              id="rePassword"
              value={formData.rePassword}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-200/80 rounded-lg shadow-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50
                       bg-white/70 backdrop-blur-sm transition-all duration-200"
            />
          </div>

          {/* Old Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700/90 mb-1">
              رمز فعلی
            </label>
            <input
              type="password"
              id="oldPassword"
              value={formData.oldPassword}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-200/80 rounded-lg shadow-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50
                       bg-white/70 backdrop-blur-sm transition-all duration-200"
              placeholder="رمز فعلی را وارد کنید"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-start gap-3 pt-4 border-t border-white/30 mt-4">
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-b from-blue-600 to-blue-700 text-white/95
                       rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-md
                       transition-all duration-200 font-medium flex items-center gap-2
                       disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <FaSpinner className="animate-spin" />
              ) : (
                "ذخیره تغییرات"
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gradient-to-b from-gray-100/80 to-gray-200/80 backdrop-blur-sm
                       text-gray-700/90 rounded-lg hover:from-gray-200/80 hover:to-gray-300/80
                       border border-white/30 shadow-sm transition-all duration-200 font-medium"
              disabled={loading}
            >
              انصراف
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileModal;
