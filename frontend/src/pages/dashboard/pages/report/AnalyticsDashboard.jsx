import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  FaMoneyBillWave,
  FaChartBar,
  FaChartLine,
  FaChartPie,
  FaCalendarAlt,
  FaPrint,
  FaUsers,
  FaBoxOpen,
  FaShoppingCart,
  FaArrowUp,
  FaArrowDown,
  FaSync,
} from "react-icons/fa";
const AnalyticsDashboard = () => {
  const [timeRange, setTimeRange] = useState("weekly");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(mockData);

  const fetchData = async (range) => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setData(mockData);
      setLoading(false);
    }, 1000);
  };

  useEffect(() => {
    fetchData(timeRange);
  }, [timeRange]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("fa-AF").format(amount) + " افغانی";
  };

  const formatNumber = (number) => {
    return new Intl.NumberFormat("fa-AF").format(number);
  };

  const getCurrentData = () => data[timeRange];

  const statsCards = [
    {
      title: "تعداد سفارشات",
      value: formatNumber(getCurrentData().orders),
      icon: FaShoppingCart,
      color: "bg-blue-500",
      change: "+12%",
      trend: "up",
    },
    {
      title: "درآمد کل",
      value: formatCurrency(getCurrentData().revenue),
      icon: FaMoneyBillWave,
      color: "bg-green-500",
      change: "+8%",
      trend: "up",
    },
    {
      title: "تحویل شده",
      value: formatNumber(getCurrentData().delivered),
      icon: FaBoxOpen,
      color: "bg-emerald-500",
      change: "+15%",
      trend: "up",
    },
    {
      title: "در انتظار",
      value: formatNumber(getCurrentData().pending),
      icon: FaUsers,
      color: "bg-orange-500",
      change: "-5%",
      trend: "down",
    },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}:{" "}
              {entry.name.includes("revenue")
                ? formatCurrency(entry.value)
                : formatNumber(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              داشبورد تحلیل‌ها
            </h1>
            <p className="text-gray-600">آمار و تحلیل‌های جامع چاپخانه اکبر</p>
          </div>

          <div className="flex items-center gap-4">          
            {/* Time Range Selector */}
            <div className="flex bg-white rounded-lg border border-gray-200 p-1">
              {["daily", "weekly", "monthly"].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    timeRange === range
                      ? "bg-cyan-600 text-white shadow-lg"
                      : "text-gray-600 hover:text-cyan-600"
                  }`}
                >
                  {range === "daily" && "امروز"}
                  {range === "weekly" && "هفته جاری"}
                  {range === "monthly" && "ماه جاری"}
                </button>
              ))}
            </div>

            <button
              onClick={() => fetchData(timeRange)}
              disabled={loading}
              className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              <FaSync className={loading ? "animate-spin" : ""} />
              بروزرسانی
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((card, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${card.color} text-white`}>
                  <card.icon className="text-xl" />
                </div>
                <div
                  className={`flex items-center gap-1 text-sm font-medium ${
                    card.trend === "up" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {card.trend === "up" ? <FaArrowUp /> : <FaArrowDown />}
                  {card.change}
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-1">
                {card.value}
              </h3>
              <p className="text-gray-600 text-sm">{card.title}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Orders & Revenue Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FaChartBar className="text-blue-600 text-xl" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">
              سفارشات و درآمد{" "}
              {timeRange === "daily"
                ? "امروز"
                : timeRange === "weekly"
                ? "هفته"
                : "ماه"}
            </h2>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getCurrentData().chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="orders"
                  name="تعداد سفارشات"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  name="درآمد"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: "#10b981" }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Trend Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <FaChartLine className="text-green-600 text-xl" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">روند درآمدی</h2>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={getCurrentData().chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="درآمد"
                  stroke="#10b981"
                  fill="url(#colorRevenue)"
                  fillOpacity={0.3}
                />
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Status */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FaChartPie className="text-purple-600 text-xl" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">وضعیت پرداخت‌ها</h2>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.paymentStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} (${(percent * 100).toFixed(0)}%)`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.paymentStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Service Types Distribution */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-cyan-100 rounded-lg">
              <FaPrint className="text-cyan-600 text-xl" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">توزیع خدمات</h2>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.serviceTypes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} (${(percent * 100).toFixed(0)}%)`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.serviceTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Customers */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-orange-100 rounded-lg">
            <FaUsers className="text-orange-600 text-xl" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">مشتریان برتر</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">
                  رتبه
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">
                  نام مشتری
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">
                  تعداد سفارشات
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">
                  مجموع خرید
                </th>
              </tr>
            </thead>
            <tbody>
              {data.topCustomers.map((customer, index) => (
                <tr
                  key={index}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        index === 0
                          ? "bg-yellow-100 text-yellow-800"
                          : index === 1
                          ? "bg-gray-100 text-gray-800"
                          : index === 2
                          ? "bg-orange-100 text-orange-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {index + 1}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-gray-800">
                    {customer.name}
                  </td>
                  <td className="py-3 px-4 text-center text-gray-600">
                    {formatNumber(customer.orders)}
                  </td>
                  <td className="py-3 px-4 text-left font-semibold text-green-600">
                    {formatCurrency(customer.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
