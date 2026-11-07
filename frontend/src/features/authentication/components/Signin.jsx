import React from "react";
import useSignin from "../hooks/useSignin";
import { useSelector } from "react-redux";

const Signin = () => {
  const {
    email,
    setEmail,
    password,
    setPassword,
    handleSignin,
    isLoading,
    error,
  } = useSignin();
  const { currentUser } = useSelector((state) => state.user);
  const isActive = currentUser?.isActive;

  return (
    <div className="flex justify-center items-center min-h-screen bg-cyan-800 p-4 relative overflow-hidden">
      {/* Top-Right Light Effect */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-cyan-400 via-transparent to-transparent rounded-full blur-3xl opacity-20 animate-pulse"></div>

      {/* Bottom-Left Light Effect */}
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-cyan-400 via-transparent to-transparent rounded-full blur-3xl opacity-20 animate-pulse"></div>

      {/* Additional floating elements for depth */}
      <div className="absolute top-20 right-20 w-32 h-32 bg-cyan-300 rounded-full blur-2xl opacity-10 animate-bounce"></div>
      <div
        className="absolute bottom-20 left-20 w-32 h-32 bg-cyan-300 rounded-full blur-2xl opacity-10 animate-bounce"
        style={{ animationDelay: "2s" }}
      ></div>

      <div className="w-full max-w-md relative z-10">
        {/* Login Form */}
        <form
          onSubmit={handleSignin}
          className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 space-y-6 transform hover:shadow-xl transition-all duration-300 border border-white/20"
        >
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-x-3">
              <div className="relative">
                <img
                  src="logo.png"
                  alt="logo"
                  className="h-14 w-14 rounded-full border-2 border-cyan-800 shadow-lg"
                />
                <div className="absolute -inset-1 bg-cyan-400 rounded-full blur opacity-30 animate-ping"></div>
              </div>
              <h1 className="text-3xl font-bold text-cyan-800 drop-shadow-sm">
             غرب سی تی پی
              </h1>
            </div>
            <p className="text-gray-600 mt-2">لطفاً اطلاعات خود را وارد کنید</p>
          </div>

          {/* Email Input */}
          <div className="space-y-2">
            <label className="block text-right text-gray-700 font-medium">
              ایمیل آدرس
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full px-4 py-3 pr-5 focus:outline-none rounded-lg border border-gray-300 focus:ring-2 focus:ring-cyan-800 focus:border-cyan-800 transition-all duration-200 bg-gray-50 text-right hover:bg-white shadow-sm"
                dir="rtl"
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label className="block text-right text-gray-700 font-medium">
              رمز عبور
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 pr-5 focus:outline-none rounded-lg border border-gray-300 focus:ring-2 focus:ring-cyan-800 focus:border-cyan-800 transition-all duration-200 bg-gray-50 text-right hover:bg-white shadow-sm"
                dir="rtl"
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <svg
                  className="w-5 h-5 text-gray-400"
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

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-cyan-800 to-cyan-700 text-white py-4 rounded-xl font-semibold text-lg transform hover:scale-105 hover:from-cyan-700 hover:to-cyan-600 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none cursor-pointer relative overflow-hidden group"
          >
            {/* Button shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>

            {isLoading ? (
              <div className="flex items-center justify-center space-x-2 relative z-10">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>در حال وارد شدن...</span>
              </div>
            ) : (
              <span className="relative z-10">وارد شدن</span>
            )}
          </button>

          {/* Error Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-right transform transition-all duration-300 animate-fade-in">
              <div className="flex items-center justify-end space-x-2 space-x-reverse">
                <svg
                  className="w-5 h-5 text-red-500 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-red-700 font-medium text-sm">{error}</p>
              </div>
            </div>
          )}

          {isActive === false && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-right transform transition-all duration-300 animate-fade-in">
              <div className="flex items-center justify-end space-x-2 space-x-reverse">
                <svg
                  className="w-5 h-5 text-yellow-600 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <p className="text-yellow-800 font-medium text-sm">
                  حساب کاربری شما غیرفعال است
                </p>
              </div>
            </div>
          )}
          <a href="/forgot_password"> رمز عبور خود را فراموش کرده اید؟</a>
          {/* Footer */}
          <div className="text-center pt-4 border-t border-gray-100">
            <p className="text-gray-600 text-sm">
                غرب سی تی پی - خدمات  با کیفیت
            </p>
            <p className="text-gray-500 text-xs mt-1">
             Gharb ctp- high Quality  Services
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signin;
