import { useState, useEffect } from "react";
import axios from "axios";
import OwnerManager from "./OwnerManager";
import MoneyManager from "./MoneyManager";

export default function Money() {
  const [activeTab, setActiveTab] = useState("moneyManager");

  return (
    <div className="bg-gradient-to-br from-gray-50 to-cyan-50 p-4 md:p-6">
      <div className="">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          
          {/* Header Section */}
          <div className="bg-gradient-to-r from-cyan-900 to-cyan-700 px-6 py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <svg 
                    className="w-8 h-8 text-white" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="2" 
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white">
                    سیستم مدیریت مالی
                  </h1>
                  <p className="text-cyan-100 mt-1 text-sm md:text-base">
                    مدیریت تراکنش‌ها، پرداخت‌ها و اطلاعات مالکان
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                <span className="text-white text-sm font-medium">
                  سیستم آنلاین
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="px-6 pt-6 pb-2">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                className={`group relative flex-1 sm:flex-none flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl font-medium transition-all duration-300 ${
                  activeTab === "moneyManager"
                    ? "bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-lg shadow-cyan-100"
                    : "text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200"
                }`}
                onClick={() => setActiveTab("moneyManager")}
              >
                <div 
                  className={`p-2 rounded-lg ${
                    activeTab === "moneyManager" 
                      ? "bg-white/20" 
                      : "bg-cyan-100"
                  }`}
                >
                  <svg 
                    className={`w-5 h-5 ${
                      activeTab === "moneyManager" 
                        ? "text-white" 
                        : "text-cyan-600"
                    }`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="2" 
                      d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                    ></path>
                  </svg>
                </div>
                <span className="text-sm md:text-base">مدیریت مالی</span>
                {activeTab === "moneyManager" && (
                  <div className="absolute -bottom-1 left-0 right-0 h-1 bg-cyan-400 rounded-t-lg"></div>
                )}
              </button>

              <button
                className={`group relative flex-1 sm:flex-none flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl font-medium transition-all duration-300 ${
                  activeTab === "owners"
                    ? "bg-gradient-to-r from-cyan-800 to-cyan-600 text-white shadow-lg shadow-cyan-100"
                    : "text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200"
                }`}
                onClick={() => setActiveTab("owners")}
              >
                <div 
                  className={`p-2 rounded-lg ${
                    activeTab === "owners" 
                      ? "bg-white/20" 
                      : "bg-cyan-100"
                  }`}
                >
                  <svg 
                    className={`w-5 h-5 ${
                      activeTab === "owners" 
                        ? "text-white" 
                        : "text-cyan-600"
                    }`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="2" 
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    ></path>
                  </svg>
                </div>
                <span className="text-sm md:text-base">مدیریت مالکان</span>
                {activeTab === "owners" && (
                  <div className="absolute -bottom-1 left-0 right-0 h-1 bg-cyan-400 rounded-t-lg"></div>
                )}
              </button>
            </div>

            {/* Tab Indicator Line */}
            <div className="mt-4 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
          </div>

          {/* Active Tab Content with Smooth Transition */}
          <div className="px-4 md:px-6 pb-6 md:pb-8">
            <div className="transition-all duration-500 ease-in-out">
              {activeTab === "moneyManager" && (
                <div className="animate-fadeIn">
                  <MoneyManager />
                </div>
              )}
              {activeTab === "owners" && (
                <div className="animate-fadeIn">
                  <OwnerManager />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}