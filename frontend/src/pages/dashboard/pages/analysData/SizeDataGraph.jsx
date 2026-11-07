// SizeDataGraph.jsx
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  FaSpinner,
  FaSyncAlt,
  FaBoxOpen,
  FaMoneyBillWave,
  FaTruckLoading,
  FaLayerGroup,
  FaChartLine,
  FaChartBar,
  FaExclamationTriangle,
} from "react-icons/fa";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const BASE_URL = import.meta.env.VITE_BASE_URL;

/**
 * Props:
 *   selectedSize  – string (required to show data)
 *   from          – YYYY-MM-DD
 *   to            – YYYY-MM-DD
 *   approved      – "true" | "false" | "all" (optional, defaults "true")
 *   hideCurrentMonth – boolean (optional, defaults true)
 */
const SizeDataGraph = ({
  selectedSize = "",
  from,
  to,
  approved = "true",
  hideCurrentMonth = true,
}) => {
  const [rawData, setRawData] = useState(null);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState("");
  const [excludeCurrentMonth, setExcludeCurrentMonth] = useState(
    hideCurrentMonth
  );

  /* ============================================================
     Fetch monthly data when the parent's selection changes
  ============================================================ */
  useEffect(() => {
    if (!selectedSize) {
      setRawData(null);
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      setLoadingData(true);
      setError("");
      try {
        const params = { from, to, size: selectedSize };
        if (approved !== "all") params.approved = approved;

        const res = await axios.get(
          `${BASE_URL}/orderItems/by-size-month`,
          { params }
        );
        if (!cancelled) setRawData(res.data);
      } catch (err) {
        if (cancelled) return;
        console.error("Error fetching graph data:", err);
        setError(
          err.response?.data?.message || "خطا در دریافت داده نمودار"
        );
        setRawData(null);
      } finally {
        if (!cancelled) setLoadingData(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [selectedSize, from, to, approved]);

  /* ============================================================
     Current month label in "YYYY-MM"
  ============================================================ */
  const currentMonthLabel = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
  }, []);

  /* ============================================================
     Reshape backend response → Recharts array
     Optionally excludes the current month.
  ============================================================ */
  const { chartData, hiddenCurrentMonth, totalMonthsFromApi } =
    useMemo(() => {
      if (!rawData) {
        return {
          chartData: [],
          hiddenCurrentMonth: false,
          totalMonthsFromApi: 0,
        };
      }

      const months = rawData?.range?.months || [];
      const matrix = rawData?.matrix || {};
      const monthly = rawData?.monthly || [];

      const monthlyMap = {};
      monthly.forEach((row) => {
        if (row.size === selectedSize) {
          monthlyMap[row.month] = {
            qty: Number(row.totalQty) || 0,
            money: Number(row.totalMoney) || 0,
            orders: Number(row.orderCount) || 0,
          };
        }
      });

      const sizeRow = matrix[selectedSize] || {};

      const monthHasCurrent = months.includes(currentMonthLabel);
      const visibleMonths =
        excludeCurrentMonth && monthHasCurrent
          ? months.filter((m) => m !== currentMonthLabel)
          : months;

      const data = visibleMonths.map((m) => {
        const fromMonthly = monthlyMap[m];
        const qty = fromMonthly
          ? fromMonthly.qty
          : Number(sizeRow[m]) || 0;
        const money = fromMonthly ? fromMonthly.money : 0;
        const orders = fromMonthly ? fromMonthly.orders : 0;
        return { label: m, qnty: qty, money, orders };
      });

      return {
        chartData: data,
        hiddenCurrentMonth:
          excludeCurrentMonth && monthHasCurrent,
        totalMonthsFromApi: months.length,
      };
    }, [rawData, selectedSize, excludeCurrentMonth, currentMonthLabel]);

  /* ============================================================
     Totals
  ============================================================ */
  const totals = useMemo(
    () =>
      chartData.reduce(
        (acc, d) => ({
          qnty: acc.qnty + d.qnty,
          money: acc.money + d.money,
          orders: acc.orders + d.orders,
        }),
        { qnty: 0, money: 0, orders: 0 }
      ),
    [chartData]
  );

  /* ============================================================
     Helpers
  ============================================================ */
  const refresh = () => {
    if (!selectedSize) return;
    setLoadingData(true);
    const params = { from, to, size: selectedSize };
    if (approved !== "all") params.approved = approved;

    axios
      .get(`${BASE_URL}/orderItems/by-size-month`, { params })
      .then((res) => setRawData(res.data))
      .catch((err) =>
        setError(
          err.response?.data?.message || "خطا در دریافت داده نمودار"
        )
      )
      .finally(() => setLoadingData(false));
  };

  const fmtNum = (n) =>
    Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });
  const fmtMoney = (n) =>
    Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });

  /* ============================================================
     Early states
  ============================================================ */
  if (!selectedSize) {
    return (
      <div className="p-8 text-center text-gray-500 border rounded-lg">
        <FaChartLine className="text-3xl text-gray-300 mx-auto mb-2" />
        <p className="text-sm">برای مشاهده نمودار یک سایز انتخاب کنید</p>
      </div>
    );
  }

  if (loadingData && !rawData) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <FaSpinner className="text-3xl text-cyan-800 animate-spin mb-3" />
        <p className="text-gray-600 text-sm">در حال بارگذاری نمودار...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center text-red-700 text-sm">
        {error}
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 border rounded-lg">
        <FaChartLine className="text-3xl text-gray-300 mx-auto mb-2" />
        <p className="text-sm">
          داده‌ای برای سایز «{selectedSize}» یافت نشد
        </p>
        {hiddenCurrentMonth && (
          <p className="text-xs text-amber-700 mt-1">
            (ماه جاری از نمودار حذف شده است — برای مشاهده، تیک «نمایش ماه
            جاری» را بزنید)
          </p>
        )}
      </div>
    );
  }

  /* ============================================================
     Main render — BOTH charts visible
  ============================================================ */
  return (
    <div className="border border-gray-100 rounded-lg overflow-hidden bg-white">
      {/* ----- Sub-header ----- */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b flex-wrap gap-2">
        <div className="flex items-center gap-3 text-xs flex-wrap">
          <span className="font-medium text-gray-700">
            نمودار ستونی و خطی — {selectedSize}
          </span>
          <span className="flex items-center gap-1 text-gray-500">
            <FaLayerGroup /> {chartData.length} ماه
          </span>
          {hiddenCurrentMonth && (
            <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
              <FaExclamationTriangle /> ماه جاری نمایش داده نمی‌شود
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Toggle: show/hide current month */}
          <label className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={!excludeCurrentMonth}
              onChange={(e) =>
                setExcludeCurrentMonth(!e.target.checked)
              }
              className="accent-cyan-600"
            />
            نمایش ماه جاری
          </label>

          <button
            onClick={refresh}
            disabled={loadingData}
            className="flex items-center gap-1 bg-cyan-600 hover:bg-cyan-700 text-white px-2 py-1 rounded text-xs disabled:opacity-60"
          >
            {loadingData ? (
              <FaSpinner className="animate-spin" />
            ) : (
              <FaSyncAlt />
            )}
            بروزرسانی
          </button>
        </div>
      </div>

      {/* ----- Mini summary ----- */}
      <div className="grid grid-cols-3 gap-2 p-3 border-b bg-white">
        <MiniStat
          icon={<FaBoxOpen />}
          label="تعداد"
          value={fmtNum(totals.qnty)}
          color="blue"
        />
        <MiniStat
          icon={<FaMoneyBillWave />}
          label="مبلغ (افغانی)"
          value={fmtMoney(totals.money)}
          color="green"
        />
        <MiniStat
          icon={<FaTruckLoading />}
          label="سفارشات"
          value={fmtNum(totals.orders)}
          color="cyan"
        />
      </div>

      {/* ============================================================
          BAR CHART
         ============================================================ */}
      <div className="p-3 border-b">
        <h4 className="text-xs font-bold text-cyan-800 mb-2 flex items-center gap-1">
          <FaChartBar /> نمودار ستونی (تعداد + مبلغ)
        </h4>
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip
                formatter={(value, name) =>
                  name === "Revenue" ? fmtMoney(value) : fmtNum(value)
                }
              />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="qnty"
                name="Quantity"
                fill="#0891b2"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                yAxisId="right"
                dataKey="money"
                name="Revenue"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ============================================================
          LINE CHART
         ============================================================ */}
      <div className="p-3">
        <h4 className="text-xs font-bold text-cyan-800 mb-2 flex items-center gap-1">
          <FaChartLine /> نمودار خطی (روند تعداد + مبلغ)
        </h4>
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip
                formatter={(value, name) =>
                  name === "Revenue" ? fmtMoney(value) : fmtNum(value)
                }
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="qnty"
                name="Quantity"
                stroke="#0891b2"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="money"
                name="Revenue"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ----- Footer note (only when current month hidden) ----- */}
      {hiddenCurrentMonth && (
        <div className="px-3 py-2 text-[11px] text-amber-800 bg-amber-50 border-t">
          💡 داده‌های ماه جاری به دلیل ناقص بودن از نمودار حذف شده‌اند.
          برای نمایش، تیک «نمایش ماه جاری» را فعال کنید.
        </div>
      )}
    </div>
  );
};

/* ============================================================
   MiniStat sub-component
============================================================ */
const MiniStat = ({ icon, label, value, color = "cyan" }) => {
  const colors = {
    cyan: "from-cyan-500 to-cyan-600",
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
  };
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 border border-gray-100">
      <div
        className={`p-1.5 rounded bg-gradient-to-br ${colors[color]} text-white text-sm`}
      >
        {icon}
      </div>
      <div className="text-right">
        <p className="text-[10px] text-gray-500 leading-none">{label}</p>
        <p className="text-sm font-bold text-gray-800 leading-tight">
          {value}
        </p>
      </div>
    </div>
  );
};

export default SizeDataGraph;