// StockForecastGraph.jsx
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import {
  FaSpinner,
  FaSyncAlt,
  FaBoxOpen,
  FaCalendarDay,
  FaExclamationTriangle,
  FaTruckLoading,
  FaCheckCircle,
  FaChartLine,
} from "react-icons/fa";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot,
} from "recharts";

const BASE_URL = import.meta.env.VITE_BASE_URL;

/**
 * Props:
 *   selectedSize  – string (required)
 *   days          – horizon for projection (default 90)
 *   leadTimeDays  – supplier lead time (default 14)
 *   safetyDays    – safety buffer (default 7)
 *   windowDays    – consumption lookback (default 30)
 */
const StockForecastGraph = ({
  selectedSize = "",
  days = 90,
  leadTimeDays = 14,
  safetyDays = 7,
  windowDays = 30,
}) => {
  const { currentUser } = useSelector((state) => state.user);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ============================================================
     Fetch forecast when size / params change
  ============================================================ */
  useEffect(() => {
    if (!selectedSize) {
      setData(null);
      return;
    }

    let cancelled = false;

    const fetchForecast = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(
          `${BASE_URL}/orderItems/forecast`,
          {
            params: {
              size: selectedSize,
              days,
              leadTimeDays,
              safetyDays,
              windowDays,
            },
          }
        );
        if (!cancelled) setData(res.data);
      } catch (err) {
        if (cancelled) return;
        console.error("Error fetching forecast:", err);
        setError(
          err.response?.data?.message || "خطا در دریافت پیش‌بینی موجودی"
        );
        setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchForecast();
    return () => {
      cancelled = true;
    };
  }, [selectedSize, days, leadTimeDays, safetyDays, windowDays]);

  /* ============================================================
     Derived values
  ============================================================ */
  const series = data?.series || [];
  const summary = data?.summary || {};

  // Where does the projection hit 0?
  const depletionPoint = useMemo(() => {
    if (!series.length) return null;
    const idx = series.findIndex((p) => p.projected === 0);
    return idx >= 0 ? series[idx] : null;
  }, [series]);

  // Reorder threshold (lead time + safety)
  const reorderThreshold = useMemo(() => {
    if (!data) return 0;
    return Math.ceil(data.dailyRate * (leadTimeDays + safetyDays));
  }, [data, leadTimeDays, safetyDays]);

  const refresh = () => {
    if (!selectedSize) return;
    setLoading(true);
    axios
      .get(`${BASE_URL}/orderItems/forecast`, {
        params: {
          size: selectedSize,
          days,
          leadTimeDays,
          safetyDays,
          windowDays,
        },
      })
      .then((res) => setData(res.data))
      .catch((err) =>
        setError(
          err.response?.data?.message || "خطا در دریافت پیش‌بینی موجودی"
        )
      )
      .finally(() => setLoading(false));
  };

  const fmtNum = (n) =>
    Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });

  /* ============================================================
     Early states
  ============================================================ */
  if (!selectedSize) {
    return (
      <div className="p-8 text-center text-gray-500 border rounded-lg">
        <FaChartLine className="text-3xl text-gray-300 mx-auto mb-2" />
        <p className="text-sm">برای مشاهده پیش‌بینی موجودی یک سایز انتخاب کنید</p>
      </div>
    );
  }
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <FaSpinner className="text-3xl text-cyan-800 animate-spin mb-3" />
        <p className="text-gray-600 text-sm">در حال محاسبه پیش‌بینی...</p>
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

  // ✅ THE MISSING GUARD — prevents `data.size` crash
  if (!data) {
    return (
      <div className="p-8 text-center text-gray-500 border rounded-lg">
        <FaChartLine className="text-3xl text-gray-300 mx-auto mb-2" />
        <p className="text-sm">داده‌ای برای این سایز یافت نشد</p>
      </div>
    );
  }

  /* ============================================================
     Main render
  ============================================================ */
  const statusColors = {
    ok: "bg-green-50 text-green-700 border-green-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    critical: "bg-red-50 text-red-700 border-red-200",
    out_of_stock: "bg-red-100 text-red-800 border-red-300",
  };
  const statusLabels = {
    ok: "موجودی کافی",
    warning: "نزدیک به اتمام",
    critical: "بحرانی — سفارش دهید",
    out_of_stock: "تمام شده",
  };

  return (
    <div className="border border-gray-100 rounded-lg overflow-hidden bg-white">
      {/* ----- Sub-header ----- */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-gray-700 text-sm">
            پیش‌بینی موجودی — {data.size}
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded border ${statusColors[data.status]
              }`}
          >
            {statusLabels[data.status]}
          </span>
        </div>

        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-1 bg-cyan-600 hover:bg-cyan-700 text-white px-2 py-1 rounded text-xs disabled:opacity-60"
        >
          {loading ? <FaSpinner className="animate-spin" /> : <FaSyncAlt />}
          بروزرسانی
        </button>
      </div>

      {/* ----- Summary cards ----- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 p-3 border-b bg-white">
        <StatCard
          icon={<FaBoxOpen />}
          label="موجودی فعلی"
          value={fmtNum(data.currentStock)}
          color="blue"
        />
        <StatCard
          icon={<FaCalendarDay />}
          label="روزهای باقیمانده"
          value={data.daysLeft === null ? "—" : fmtNum(data.daysLeft)}
          color={
            data.daysLeft === null
              ? "gray"
              : data.daysLeft < leadTimeDays
                ? "red"
                : data.daysLeft < leadTimeDays + safetyDays
                  ? "amber"
                  : "green"
          }
        />
        <StatCard
          icon={<FaExclamationTriangle />}
          label="مصرف روزانه"
          value={`${data.dailyRate.toFixed(2)} / روز`}
          color="cyan"
        />
        <StatCard
          icon={<FaTruckLoading />}
          label="پیشنهاد خرید"
          value={`${fmtNum(summary.suggestedQty)} عدد`}
          color="purple"
        />
      </div>

      {/* ----- Chart ----- */}
      <div className="p-3">
        <div style={{ width: "100%", height: 360 }}>
          <ResponsiveContainer>
            <LineChart data={series}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                interval={Math.floor(series.length / 8)}
              />
              <YAxis
                label={{
                  value: "موجودی (عدد)",
                  angle: -90,
                  position: "insideLeft",
                  style: { fontSize: 11 },
                }}
              />
              <Tooltip
                formatter={(value) => `${fmtNum(value)} عدد`}
                labelFormatter={(label) => `تاریخ: ${label}`}
              />
              <Legend />

              {/* Reorder threshold line */}
              {reorderThreshold > 0 && (
                <ReferenceLine
                  y={reorderThreshold}
                  stroke="#f59e0b"
                  strokeDasharray="4 4"
                  label={{
                    value: `آستانه سفارش (${reorderThreshold})`,
                    fontSize: 10,
                    fill: "#b45309",
                  }}
                />
              )}

              {/* Depletion marker (where line hits 0) */}
              {depletionPoint && (
                <ReferenceDot
                  x={depletionPoint.date}
                  y={0}
                  r={6}
                  fill="#dc2626"
                  stroke="#fff"
                />
              )}

              <Line
                type="monotone"
                dataKey="projected"
                name="موجودی پیش‌بینی‌شده"
                stroke="#0891b2"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ----- Advice footer ----- */}
      <div
        className={`px-3 py-2 text-xs border-t ${statusColors[data.status]
          }`}
      >
        {data.status === "ok" && (
          <>
            ✅ موجودی فعلی برای <b>{data.daysLeft} روز</b> کافی است. نیازی به
            سفارش فوری نیست.
          </>
        )}
        {data.status === "warning" && (
          <>
            ⚠️ موجودی تا <b>{data.daysLeft} روز</b> دیگر تمام می‌شود. توصیه
            می‌شود همین حالا <b>{fmtNum(summary.suggestedQty)} عدد</b> سفارش
            دهید تا در بازه تأمین ({leadTimeDays} روز) به مشکل نخورید.
          </>
        )}
        {data.status === "critical" && (
          <>
            🚨 موجودی کمتر از زمان تأمین است (<b>{data.daysLeft} روز</b>).
            فوراً <b>{fmtNum(summary.suggestedQty)} عدد</b> سفارش دهید.
          </>
        )}
        {data.status === "out_of_stock" && (
          <>
            ⛔ موجودی این سایز صفر است. سفارش فوری{" "}
            <b>{fmtNum(summary.suggestedQty)} عدد</b> الزامی است.
          </>
        )}
        {data.daysLeft === null && data.status !== "ok" && (
          <span className="ml-2 text-gray-600">
            (مصرف روزانه در {windowDays} روز گذشته ثبت نشده است)
          </span>
        )}
      </div>

      {/* ----- Legend / formula hint ----- */}
      <div className="px-3 py-2 text-[11px] text-gray-500 bg-gray-50 border-t">
        📐 پیشنهاد خرید = مصرف روزانه × (زمان تأمین {leadTimeDays} روز +
        ذخیره اطمینان {safetyDays} روز) + ذخیره اطمینان
      </div>
    </div>
  );
};

/* ============================================================
   StatCard
============================================================ */
const StatCard = ({ icon, label, value, color = "cyan" }) => {
  const colors = {
    cyan: "from-cyan-500 to-cyan-600",
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    amber: "from-amber-500 to-amber-600",
    red: "from-red-500 to-red-600",
    purple: "from-purple-500 to-purple-600",
    gray: "from-gray-400 to-gray-500",
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

export default StockForecastGraph;