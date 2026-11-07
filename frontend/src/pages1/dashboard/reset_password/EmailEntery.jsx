import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
const BASE_URL = import.meta.env.VITE_BASE_URL;

const EmailEntry = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      Swal.fire({
        icon: "warning",
        title: "ایمیل را وارد کنید!",
        text: "لطفاً ایمیل خود را برای بازیابی رمز عبور وارد کنید.",
        confirmButtonText: "باشه",
      });
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(`${BASE_URL}/users/forgot-password`, { email });

      Swal.fire({
        icon: "success",
        title: "ایمیل ارسال شد!",
        text:
          res.data.message || "لینک بازیابی رمز عبور به ایمیل شما ارسال شد.",
        confirmButtonText: "باشه",
      });
      setEmail("");
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "خطا!",
        text:
          err.response?.data?.message ||
          "خطا در ارسال لینک بازیابی. لطفاً دوباره تلاش کنید.",
        confirmButtonText: "باشه",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-cyan-800 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8 space-y-6 text-right"
      >
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">
          بازیابی رمز عبور
        </h2>
        <p className="text-gray-600 text-center text-sm mb-4">
          ایمیل خود را وارد کنید تا لینک بازیابی برای شما ارسال شود.
        </p>

        {/* Email Input */}
        <div className="relative">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="peer w-full border border-gray-300 rounded-lg px-3 pt-5 pb-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-700"
            placeholder=" "
            dir="rtl"
            required
          />
          <label className="absolute right-3 top-2 text-gray-500 text-sm transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-sm">
            ایمیل
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded-lg text-white font-semibold transition-all ${
            loading
              ? "bg-cyan-500 cursor-not-allowed"
              : "bg-cyan-700 hover:bg-cyan-800"
          }`}
        >
          {loading ? "در حال ارسال..." : "ارسال لینک بازیابی"}
        </button>

        <div className="text-center mt-4">
          <a
            href="/signin"
            className="text-cyan-700 hover:underline text-sm font-medium"
          >
            بازگشت به صفحه ورود
          </a>
        </div>
      </form>
    </div>
  );
};

export default EmailEntry;
