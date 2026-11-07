import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
const BASE_URL = import.meta.env.VITE_BASE_URL;
const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ Password match validation
    if (password !== confirmPassword) {
      Swal.fire({
        icon: "warning",
        title: "رمز عبور مطابقت ندارد!",
        text: "لطفاً رمز عبور و تکرار آن را یکسان وارد کنید.",
        confirmButtonText: "باشه",
      });
      return;
    }

    try {
      await axios.post(`${BASE_URL}/users/reset-password/${token}`, { password });
      Swal.fire({
        icon: "success",
        title: "موفق!",
        text: "رمز عبور شما با موفقیت تغییر یافت.",
        confirmButtonText: "ورود به حساب",
      }).then(() => navigate("/signin"));
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "خطا!",
        text: err.response?.data?.message || "لینک منقضی یا نامعتبر است.",
        confirmButtonText: "باشه",
      });
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-cyan-800">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md space-y-5"
      >
        <h2 className="text-center text-xl font-semibold text-gray-700">
          تنظیم رمز عبور جدید
        </h2>

        {/* New password field */}
        <input
          type="password"
          placeholder="رمز عبور جدید"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full border px-4 py-2 rounded-lg text-right focus:ring-2 focus:ring-cyan-700"
          dir="rtl"
        />

        {/* Confirm password field */}
        <input
          type="password"
          placeholder="تکرار رمز عبور جدید"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="w-full border px-4 py-2 rounded-lg text-right focus:ring-2 focus:ring-cyan-700"
          dir="rtl"
        />

        <button
          type="submit"
          className="w-full bg-cyan-700 text-white py-2 rounded-lg hover:bg-cyan-800 transition"
        >
          تغییر رمز عبور
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;
