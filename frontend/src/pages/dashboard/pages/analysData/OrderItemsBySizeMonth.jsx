import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  FaChartBar,
  FaSpinner,
  FaCalendarAlt,
  FaDownload,
  FaSyncAlt,
  FaBoxOpen,
  FaMoneyBillWave,
  FaTruckLoading,
  FaLayerGroup,
  FaListUl,
  FaArrowRight,
} from "react-icons/fa";
import { useSelector } from "react-redux";
import SizeDataGraph from "./SizeDataGraph";
import StockForecastGraph from "./StockForecastGraph";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const OrderItemsBySizeMonth = () => {
  const { currentUser } = useSelector((state) => state.user);

  // ----- Filters -----
  const today = new Date();
  const oneYearAgo = new Date(
    today.getFullYear() - 1,
    today.getMonth() + 1,
    1
  );
  const toInput = (d) => d.toISOString().split("T")[0];

  const [from, setFrom] = useState(toInput(oneYearAgo));
  const [to, setTo] = useState(toInput(today));
  const [approvedFilter, setApprovedFilter] = useState("true");

  // ----- Size list -----
  const [allSizes, setAllSizes] = useState([]);
  const [loadingSizes, setLoadingSizes] = useState(true);
  const [sizesError, setSizesError] = useState("");

  // ----- Selected size -----
  const [selectedSize, setSelectedSize] = useState("");

  // ----- Detail data -----
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* =========================================
     Fetch list of sizes
  ========================================= */
  const fetchAllSizes = async () => {
    try {
      setLoadingSizes(true);
      setSizesError("");

      const params = { from, to };
      if (approvedFilter !== "all") params.approved = approvedFilter;

      const res = await axios.get(`${BASE_URL}/orderItems/by-size-month`, {
        params,
      });

      const totals = res.data?.sizeTotals || {};
      const list = Object.keys(totals)
        .map((size) => ({
          size,
          totalQty: totals[size].totalQty || 0,
          totalMoney: totals[size].totalMoney || 0,
          orderCount: totals[size].orderCount || 0,
        }))
        .sort((a, b) => b.totalQty - a.totalQty);

      setAllSizes(list);

      if (selectedSize && !list.find((s) => s.size === selectedSize)) {
        setSelectedSize("");
        setData(null);
      }
    } catch (err) {
      console.error("Error fetching sizes list:", err);
      setSizesError(
        err.response?.data?.message || "خطا در دریافت لیست سایزها"
      );
      setAllSizes([]);
    } finally {
      setLoadingSizes(false);
    }
  };

  /* =========================================
     Fetch matrix for the SELECTED size
  ========================================= */
  const fetchDetail = async (sizeToFetch) => {
    if (!sizeToFetch) {
      setData(null);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const params = { from, to, size: sizeToFetch };
      if (approvedFilter !== "all") params.approved = approvedFilter;

      const res = await axios.get(`${BASE_URL}/orderItems/by-size-month`, {
        params,
      });

      setData(res.data);
    } catch (err) {
      console.error("Error fetching size detail:", err);
      setError(
        err.response?.data?.message ||
        "خطا در دریافت گزارش سایز انتخاب شده"
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  /* =========================================
     Effects
  ========================================= */
  useEffect(() => {
    if (!currentUser?.id) return;
    fetchAllSizes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, from, to, approvedFilter]);

  useEffect(() => {
    fetchDetail(selectedSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSize, from, to, approvedFilter]);

  /* =========================================
     Derived data
  ========================================= */
  const months = data?.range?.months || [];
  const matrix = data?.matrix || {};
  const sizeTotals = data?.sizeTotals || {};

  const selectedRow = selectedSize ? matrix[selectedSize] || {} : {};
  const selectedTotal = sizeTotals[selectedSize] || {
    totalQty: 0,
    totalMoney: 0,
    orderCount: 0,
  };

  const maxCell = useMemo(() => {
    const values = Object.values(selectedRow);
    return Math.max(...values, 1);
  }, [selectedRow]);

  /* =========================================
     CSV export
  ========================================= */
  const exportCsv = () => {
    if (!selectedSize || !months.length) return;

    const header = ["Size", ...months, "Total"];
    const row = [
      `"${selectedSize}"`,
      ...months.map((m) => selectedRow[m] || 0),
      selectedTotal.totalQty,
    ];
    const csv = [header.join(","), row.join(",")].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales_${selectedSize.replace(
      /[^\w\d]+/g,
      "_"
    )}_${from}_to_${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* =========================================
     Helpers
  ========================================= */
  const heatColor = (value) => {
    if (!value) return "bg-gray-50 text-gray-400";
    const ratio = value / maxCell;
    if (ratio > 0.75) return "bg-cyan-600 text-white font-bold";
    if (ratio > 0.5) return "bg-cyan-400 text-white font-semibold";
    if (ratio > 0.25) return "bg-cyan-200 text-cyan-900 font-medium";
    return "bg-cyan-50 text-cyan-800";
  };

  const fmtNum = (n) =>
    Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });
  const fmtMoney = (n) =>
    Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });

  /* =========================================
     Render
  ========================================= */
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* ============ Header ============ */}
      <div className="bg-gradient-to-r from-cyan-800 to-cyan-600 text-white p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-full">
              <FaChartBar className="text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                گزارش فروش بر اساس سایز و ماه
              </h2>
              <p className="text-sm text-white/80">
                {loadingSizes
                  ? "در حال بارگذاری سایزها..."
                  : `${allSizes.length} سایز موجود`}
                {selectedSize && ` | سایز انتخاب شده: ${selectedSize}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAllSizes}
              disabled={loadingSizes}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg text-sm disabled:opacity-60"
              title="بروزرسانی لیست سایزها"
            >
              {loadingSizes ? (
                <FaSpinner className="animate-spin" />
              ) : (
                <FaSyncAlt />
              )}
              بروزرسانی
            </button>

            <button
              onClick={exportCsv}
              disabled={!selectedSize || !months.length}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
              title="دانلود CSV سایز انتخاب شده"
            >
              <FaDownload />
              خروجی CSV
            </button>
          </div>
        </div>

        {/* ============ Filters ============ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-white/10 p-3 rounded-lg">
          <div>
            <label className="block text-xs text-cyan-100 mb-1">
              از تاریخ
            </label>
            <div className="flex items-center bg-white rounded-md px-2">
              <FaCalendarAlt className="text-cyan-700 text-sm" />
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full px-2 py-1.5 text-sm text-gray-800 outline-none bg-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-cyan-100 mb-1">
              تا تاریخ
            </label>
            <div className="flex items-center bg-white rounded-md px-2">
              <FaCalendarAlt className="text-cyan-700 text-sm" />
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full px-2 py-1.5 text-sm text-gray-800 outline-none bg-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-cyan-100 mb-1">
              وضعیت تایید
            </label>
            <select
              value={approvedFilter}
              onChange={(e) => setApprovedFilter(e.target.value)}
              className="w-full px-2 py-2 text-sm text-gray-800 rounded-md outline-none"
            >
              <option value="true">
                فقط تایید شده (پیشنهاد برای پیش‌بینی)
              </option>
              <option value="false">فقط در انتظار</option>
              <option value="all">همه</option>
            </select>
          </div>
        </div>
      </div>

      {/* ============ Sizes Error ============ */}
      {sizesError && (
        <div className="bg-red-50 border-b border-red-200 p-4 text-center text-red-700 text-sm">
          {sizesError}
        </div>
      )}

      {/* ============ Size Selector ============ */}
      {!loadingSizes && allSizes.length > 0 && (
        <div className="p-4 border-b bg-gray-50">
          <label className="block text-sm font-bold text-cyan-800 mb-2 flex items-center gap-2">
            <FaListUl /> یک سایز برای مشاهده جزئیات انتخاب کنید
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {allSizes.map((s) => {
              const isActive = s.size === selectedSize;
              return (
                <button
                  key={s.size}
                  onClick={() => setSelectedSize(isActive ? "" : s.size)}
                  className={`text-right p-2 rounded-lg border transition-all ${isActive
                      ? "bg-cyan-600 text-white border-cyan-700 shadow-md"
                      : "bg-white hover:bg-cyan-50 border-gray-200 text-gray-800"
                    }`}
                >
                  <div className="font-semibold text-sm truncate">
                    {s.size}
                  </div>
                  <div
                    className={`text-xs mt-1 ${isActive ? "text-cyan-100" : "text-gray-500"
                      }`}
                  >
                    {fmtNum(s.totalQty)} عدد · {fmtNum(s.orderCount)} سفارش
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ============ Empty sizes ============ */}
      {!loadingSizes && allSizes.length === 0 && !sizesError && (
        <div className="p-10 text-center text-gray-500">
          <FaLayerGroup className="text-4xl text-gray-300 mx-auto mb-3" />
          <p className="text-lg">هیچ سایزی در این بازه یافت نشد</p>
          <p className="text-sm text-gray-400">
            بازه تاریخ یا فیلترها را تغییر دهید
          </p>
        </div>
      )}

      {/* ============ No size selected yet ============ */}
      {!selectedSize && allSizes.length > 0 && (
        <div className="p-10 text-center text-gray-500">
          <FaArrowRight className="text-4xl text-gray-300 mx-auto mb-3 rotate-90" />
          <p className="text-lg">برای مشاهده جزئیات، یک سایز انتخاب کنید</p>
          <p className="text-sm text-gray-400">
            جدول فروش ماهانه، نمودار و خروجی CSV برای سایز انتخاب شده نمایش
            داده می‌شود
          </p>
        </div>
      )}

      {/* ============ Detail error ============ */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 p-4 text-center text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* ============ Loading detail ============ */}
      {selectedSize && loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <FaSpinner className="text-4xl text-cyan-800 animate-spin mb-4" />
          <p className="text-gray-600">در حال بارگذاری جزئیات سایز...</p>
        </div>
      )}

      {/* ============ Detail (selected size) ============ */}
      {selectedSize && !loading && data && (
        <>
          {/* ----- Summary cards ----- */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-gray-50 border-b">
            <SummaryCard
              icon={<FaLayerGroup />}
              label="سایز انتخاب شده"
              value={
                <span className="text-sm font-mono">{selectedSize}</span>
              }
              color="cyan"
            />
            <SummaryCard
              icon={<FaBoxOpen />}
              label="مجموع تعداد فروش"
              value={fmtNum(selectedTotal.totalQty)}
              color="blue"
            />
            <SummaryCard
              icon={<FaMoneyBillWave />}
              label="مجموع مبلغ (افغانی)"
              value={fmtMoney(selectedTotal.totalMoney)}
              color="green"
            />
            <SummaryCard
              icon={<FaTruckLoading />}
              label="تعداد سفارشات"
              value={fmtNum(selectedTotal.orderCount)}
              color="purple"
            />
          </div>

          {/* ----- Matrix table (single size) ----- */}
          <div className="overflow-x-auto">
            <table className="w-full text-center text-sm">
              <thead className="bg-cyan-50 text-cyan-800">
                <tr>
                  <th className="p-2 border-b font-semibold text-right min-w-[140px]">
                    سایز
                  </th>
                  {months.map((m) => (
                    <th
                      key={m}
                      className="p-2 border-b font-semibold whitespace-nowrap min-w-[70px]"
                    >
                      {m}
                    </th>
                  ))}
                  <th className="p-2 border-b font-bold bg-cyan-100 whitespace-nowrap">
                    مجموع
                  </th>
                  <th className="p-2 border-b font-bold bg-cyan-100 whitespace-nowrap">
                    میانگین/ماه
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b last:border-0">
                  <td className="p-2 font-medium text-gray-800 text-right">
                    <span className="bg-cyan-100 text-cyan-800 px-2 py-1 rounded text-xs font-bold">
                      {selectedSize}
                    </span>
                  </td>
                  {months.map((m) => {
                    const val = selectedRow[m] || 0;
                    return (
                      <td key={m} className="p-1">
                        <span
                          className={`inline-block w-full px-1 py-1 rounded text-xs ${heatColor(
                            val
                          )}`}
                          title={`${selectedSize} — ${m} — ${val} عدد`}
                        >
                          {val === 0 ? "—" : val}
                        </span>
                      </td>
                    );
                  })}
                  <td className="p-2 font-bold text-cyan-800 bg-cyan-50">
                    {fmtNum(selectedTotal.totalQty)}
                  </td>
                  <td className="p-2 font-semibold text-cyan-700 bg-cyan-50">
                    {months.length
                      ? (selectedTotal.totalQty / months.length).toFixed(1)
                      : 0}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ============================================
              👇 REPLACED: Full SizeDataGraph (Recharts)
              ============================================ */}
          <div className="p-4 border-t bg-white">
            <h3 className="text-sm font-bold text-cyan-800 mb-3 flex items-center gap-2">
              <FaChartBar /> نمودار تفصیلی — {selectedSize}
            </h3>
            <SizeDataGraph
              selectedSize={selectedSize}
              from={from}
              to={to}
            />
            <StockForecastGraph
              selectedSize={selectedSize}
              days={90}
              leadTimeDays={14}
              safetyDays={7}
              windowDays={30}
            />
          </div>

          {/* ----- Legend ----- */}
          <div className="p-3 border-t text-xs text-gray-500 flex flex-wrap items-center justify-center gap-3">
            <span className="font-medium">راهنمای رنگ (شدت فروش):</span>
            <LegendDot className="bg-cyan-50" label="کم" />
            <LegendDot className="bg-cyan-200" label="متوسط" />
            <LegendDot className="bg-cyan-400" label="زیاد" />
            <LegendDot className="bg-cyan-600" label="بیشترین" />
          </div>

          {/* ----- Forecast hint ----- */}
          <div className="p-3 border-t bg-yellow-50 text-xs text-yellow-800 text-center">
            💡 این جدول را با دکمه «خروجی CSV» دانلود کنید و به مدل پیش‌بینی
            (micro-ml / moving average) بدهید تا تعداد سفارش ماه آینده محاسبه
            شود.
          </div>
        </>
      )}
    </div>
  );
};

/* ============================================================
   Sub-components
============================================================ */

const SummaryCard = ({ icon, label, value, color = "cyan" }) => {
  const colors = {
    cyan: "from-cyan-500 to-cyan-600",
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    purple: "from-purple-500 to-purple-600",
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3 flex items-center gap-3">
      <div
        className={`p-2 rounded-lg bg-gradient-to-br ${colors[color]} text-white text-lg`}
      >
        {icon}
      </div>
      <div className="text-right">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-lg font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
};

const LegendDot = ({ className, label }) => (
  <span className="flex items-center gap-1">
    <span className={`inline-block w-4 h-4 rounded ${className}`} />
    {label}
  </span>
);

export default OrderItemsBySizeMonth;