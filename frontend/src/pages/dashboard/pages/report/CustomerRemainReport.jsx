import React, { useState, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import moment from "moment-jalaali";

import VazirmatnTTF from "../../../../../public/ttf/Vazirmatn.js";

moment.locale("en");
const BASE_URL = import.meta.env.VITE_BASE_URL;

const CustomerRemainReport = () => {
  const [customersData, setCustomersData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [grandTotalRemaining, setGrandTotalRemaining] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);

  useEffect(() => {
    fetchRemainData();
  }, []);

  const fetchRemainData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/remain/customer`);
      const { customers, customerCount, grandTotalRemaining } = res.data;
      setCustomersData(customers || []);
      setTotalCustomers(customerCount || 0);
      setGrandTotalRemaining(grandTotalRemaining || 0);
    } catch (err) {
      console.error("Error fetching remain data:", err);
      alert(err.response?.data?.message || "خطا در دریافت اطلاعات");
    } finally {
      setLoading(false);
    }
  };

  // Filter customers by name (if searchTerm is not empty)
  const filteredCustomers = searchTerm.trim()
    ? customersData.filter((item) =>
      item.customer.fullname.toLowerCase().includes(searchTerm.toLowerCase().trim())
    )
    : customersData; // show all when search is empty

const handleDownloadPDF = () => {
  if (filteredCustomers.length === 0) {
    alert("هیچ داده‌ای برای导出 وجود ندارد");
    return;
  }

  const doc = new jsPDF({
    orientation: "p",
    unit: "pt",
    format: "a4",
  });
  doc.setR2L(false);

  // Add Font
  doc.addFileToVFS("Vazirmatn.ttf", VazirmatnTTF);
  doc.addFont("Vazirmatn.ttf", "Vazirmatn", "normal");
  doc.setFont("Vazirmatn");

  const pageWidth = doc.internal.pageSize.width;
  const margin = 40;
  const today = moment().format("YYYY/MM/DD");

  // ---- Draw title ONLY on first page (before table) ----
  doc.setFontSize(14);
  doc.text(
    "گزارش باقیمانده حساب مشتریان",
    pageWidth - margin,
    120,
    { align: "right" }
  );
  // Optionally add date here if you want it only on first page:
  // doc.setFontSize(11);
  // doc.text(`تاریخ گزارش: ${today}`, pageWidth - margin, 135, { align: "right" });

  // ---- Table headers and body ----
  const headers = [["نام مشتری", "تعداد سفارش", "کل مبلغ", "کل دریافت", "باقیمانده"]];
  const body = filteredCustomers.map((item) => [
    item.customer.fullname,
    item.orderCount.toString(),
    item.totalMoney.toLocaleString(),
    item.totalReceipt.toLocaleString(),
    item.remainingMoney.toLocaleString(),
  ]);

  autoTable(doc, {
    startY: 140,                // table starts after title on first page
    margin: {
      top: 140,                 // on subsequent pages, table starts here
      left: margin,
      right: margin,
      bottom: 60,
    },
    head: headers,
    body: body,
    theme: "grid",
    styles: {
      font: "Vazirmatn",
      fontSize: 10,
      halign: "center",
      valign: "middle",
      cellPadding: 8,
    },
    headStyles: {
      font: "Vazirmatn",
      fontStyle: "normal",
      fillColor: [70, 130, 180],
      textColor: [255, 255, 255],
      fontSize: 10,
      halign: "center",
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 'auto' },
      4: { cellWidth: 'auto' },
    },
    didDrawCell: (data) => {
      if (data.cell) data.cell.styles.font = "Vazirmatn";
    },
    // No didDrawPage – so no header repeats on later pages
  });

  // ---- Summary after the table ----
  const finalY = doc.lastAutoTable.finalY + 30;
  const totalRemaining = filteredCustomers.reduce((sum, item) => sum + item.remainingMoney, 0);
  const totalOrders = filteredCustomers.reduce((sum, item) => sum + item.orderCount, 0);

  doc.setFontSize(11);
  doc.text(
    `تعداد مشتریان: ${filteredCustomers.length}`,
    pageWidth - margin,
    finalY,
    { align: "right" }
  );
  doc.text(
    `مجموع سفارشات: ${totalOrders}`,
    pageWidth - margin,
    finalY + 20,
    { align: "right" }
  );
  doc.text(
    `مجموع باقیمانده کل: ${totalRemaining.toLocaleString()} افغانی`,
    pageWidth - margin,
    finalY + 40,
    { align: "right" }
  );
  doc.text(
    `تاریخ صدور: ${today}`,
    pageWidth - margin,
    finalY + 60,
    { align: "right" }
  );

  // ---- Page numbers on every page ----
  const pageCount = doc.internal.getNumberOfPages();
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(10);
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(
      `${i}/${pageCount}`,
      pageWidth - margin,
      pageHeight - 40,
      { align: "right" }
    );
  }

  doc.save(`باقیمانده_مشتریان_${today}.pdf`);
};

  return (
    <div className="p-4 sm:p-6 space-y-4 bg-white rounded-lg shadow">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-800">گزارش باقیمانده حساب مشتریان</h2>

      {/* Summary Cards – always show real data */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-sm text-gray-500">تعداد کل مشتریان</div>
          <div className="text-2xl font-bold text-blue-700">{totalCustomers}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-sm text-gray-500">مجموع باقیمانده کل</div>
          <div className="text-2xl font-bold text-green-700">{grandTotalRemaining.toLocaleString()} افغانی</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="text-sm text-gray-500">تعداد مشتریان دارای باقیمانده</div>
          <div className="text-2xl font-bold text-purple-700">
            {customersData.filter(c => c.remainingMoney > 0).length}
          </div>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {/* <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="جستجوی نام مشتری..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border p-2.5 rounded bg-white text-black text-sm"
          />
        </div> */}
        <button
          onClick={handleDownloadPDF}
          disabled={loading || filteredCustomers.length === 0}
          className="bg-cyan-800 text-white px-6 py-2.5 rounded hover:bg-cyan-700 disabled:bg-gray-400 transition-colors text-sm font-medium whitespace-nowrap"
        >
          {loading ? "در حال بارگذاری..." : "دانلود PDF"}
        </button>
      </div>

      {/* Table */}
      {/* <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-sm text-right">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-700">نام مشتری</th>
              <th className="px-4 py-3 font-medium text-gray-700">تعداد سفارش</th>
              <th className="px-4 py-3 font-medium text-gray-700">کل مبلغ</th>
              <th className="px-4 py-3 font-medium text-gray-700">کل دریافت</th>
              <th className="px-4 py-3 font-medium text-gray-700">باقیمانده</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="text-center py-8 text-gray-500">
                  <span className="inline-flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    در حال بارگذاری...
                  </span>
                </td>
              </tr>
            ) : filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-8 text-gray-500">
                  {searchTerm.trim() ? "مشتری با این نام یافت نشد" : "هیچ داده‌ای موجود نیست"}
                </td>
              </tr>
            ) : (
              filteredCustomers.map((item) => (
                <tr key={item.customer.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium">{item.customer.fullname}</td>
                  <td className="px-4 py-3">{item.orderCount}</td>
                  <td className="px-4 py-3">{item.totalMoney.toLocaleString()}</td>
                  <td className="px-4 py-3">{item.totalReceipt.toLocaleString()}</td>
                  <td className={`px-4 py-3 font-semibold ${item.remainingMoney > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {item.remainingMoney.toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div> */}

      {/* Footer – shown when there are results */}
      {!loading && filteredCustomers.length > 0 && (
        <div className="text-sm text-gray-500 flex justify-between items-center">
          <span>تعداد نمایش: {filteredCustomers.length} از {customersData.length}</span>
          <span>مجموع باقیمانده نمایش داده شده: {filteredCustomers.reduce((sum, c) => sum + c.remainingMoney, 0).toLocaleString()} افغانی</span>
        </div>
      )}
    </div>
  );
};

export default CustomerRemainReport;