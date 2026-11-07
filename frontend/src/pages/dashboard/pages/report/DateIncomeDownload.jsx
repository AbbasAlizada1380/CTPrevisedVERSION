import React, { useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import moment from "moment-jalaali";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import VazirmatnTTF from "../../../../../public/ttf/Vazirmatn.js";

moment.locale("en");
const BASE_URL = import.meta.env.VITE_BASE_URL;

const DateIncomeDownload = () => {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);

  const parseNumber = (val) => parseFloat(val) || 0;

  const fetchIncomes = async () => {
    const params = new URLSearchParams();
    if (fromDate) params.append("from", fromDate);
    if (toDate) params.append("to", toDate);
    params.append("limit", "100000");

    const res = await axios.get(`${BASE_URL}/stock/income/date-range?${params.toString()}`);
    return res.data.incomes || [];
  };

const handlePDFDownload = async () => {
  if (!fromDate || !toDate) {
    alert("لطفاً بازه زمانی را انتخاب کنید");
    return;
  }

  try {
    setLoading(true);
    const incomes = await fetchIncomes();

    if (!incomes.length) {
      alert("هیچ درآمدی در این بازه یافت نشد");
      return;
    }

    // ─── Overall totals ──────────────────────────────────────────────
    const totalQuantity = incomes.reduce((sum, i) => sum + parseNumber(i.quantity), 0);
    const totalMoney = incomes.reduce((sum, i) => sum + parseNumber(i.money), 0);
    const totalSpent = incomes.reduce((sum, i) => sum + parseNumber(i.spent), 0);
    const totalProfit = totalMoney - totalSpent;

    // ─── Size summary ──────────────────────────────────────────────────
    const sizeMap = incomes.reduce((acc, inc) => {
      const size = inc.size || "بدون سایز";
      if (!acc[size]) {
        acc[size] = { size, totalQuantity: 0, totalMoney: 0, totalSpent: 0 };
      }
      acc[size].totalQuantity += parseNumber(inc.quantity);
      acc[size].totalMoney += parseNumber(inc.money);
      acc[size].totalSpent += parseNumber(inc.spent);
      return acc;
    }, {});
    const sizeSummary = Object.values(sizeMap).map((s) => ({
      ...s,
      totalProfit: s.totalMoney - s.totalSpent,
    }));
    sizeSummary.sort((a, b) => a.size.localeCompare(b.size));

    // ─── PDF ──────────────────────────────────────────────────────────
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    doc.setR2L(false);
    doc.addFileToVFS("Vazirmatn.ttf", VazirmatnTTF);
    doc.addFont("Vazirmatn.ttf", "Vazirmatn", "normal");
    doc.setFont("Vazirmatn");

    const today = moment().format("YYYY/MM/DD");
    const dateRangeStr = `${moment(fromDate).format("YYYY/MM/DD")} تا ${moment(toDate).format("YYYY/MM/DD")}`;

    // ─── Title (aligned with payments report) ──────────────────────
    doc.setFontSize(14);
    doc.text(`گزارش درآمدها (${dateRangeStr})`, doc.internal.pageSize.getWidth() - 40, 120, { align: "right" });
    doc.setFontSize(10);
    doc.text(`تاریخ تهیه: ${today}`, doc.internal.pageSize.getWidth() - 40, 140, { align: "right" });

    // ─── Main table ──────────────────────────────────────────────────
    const headers = [
      ["شناسه", "فروشنده", "سایز", "تعداد", "قیمت واحد", "مجموع (؋)", "هزینه (؋)", "سود (؋)", "تاریخ"]
    ];
    const body = incomes.map((inc) => {
      const money = parseNumber(inc.money);
      const spent = parseNumber(inc.spent);
      const profit = money - spent;
      return [
        inc.id,
        inc.seller?.fullname || `فروشنده ${inc.sellerId}`,
        inc.size || "—",
        inc.quantity,
        inc.price,
        money.toLocaleString(),
        spent.toLocaleString(),
        profit.toLocaleString(),
        moment(inc.createdAt).format("YYYY/MM/DD"),
      ];
    });

 autoTable(doc, {
  startY: 160,
  margin: {
    top: 160,
    bottom: 60,
    left: 20,
    right: 20,
  },
  head: headers,
  body: body,
  theme: "grid",
  styles: { font: "Vazirmatn", fontSize: 8, halign: "center", valign: "middle" },
  headStyles: { fillColor: [220, 220, 220], textColor: 20, fontStyle: "normal" },
});

    let y = doc.lastAutoTable.finalY + 20;

    // ─── Size summary table ──────────────────────────────────────────
    if (sizeSummary.length > 0) {
      doc.setFontSize(11);
      doc.text("خلاصه سایزها", doc.internal.pageSize.getWidth() - 40, y, { align: "right" });
      y += 15;

      const sizeHeaders = [["سایز", "تعداد کل"]];
      const sizeBody = sizeSummary.map((s) => [
        s.size,
        s.totalQuantity.toLocaleString(),
      ]);

      autoTable(doc, {
        startY: y,
        head: sizeHeaders,
        body: sizeBody,
        theme: "grid",
        styles: { font: "Vazirmatn", fontSize: 9, halign: "center", valign: "middle" },
        headStyles: { fillColor: [200, 200, 200], textColor: 20, fontStyle: "normal" },
        margin: { left: 20, right: 20, bottom: 20 },
      });

      y = doc.lastAutoTable.finalY + 20;
    }

    // ─── Overall totals ──────────────────────────────────────────────
    doc.setFontSize(11);
    doc.text(`تعداد کل درآمدها: ${incomes.length}`, doc.internal.pageSize.getWidth() - 40, y, { align: "right" });
    y += 18;
    doc.text(`مجموع تعداد: ${totalQuantity.toLocaleString()}`, doc.internal.pageSize.getWidth() - 40, y, { align: "right" });
    y += 18;
    doc.text(`مجموع کل: ${totalMoney.toLocaleString()} ؋`, doc.internal.pageSize.getWidth() - 40, y, { align: "right" });
    y += 18;
    doc.text(`مجموع هزینه: ${totalSpent.toLocaleString()} ؋`, doc.internal.pageSize.getWidth() - 40, y, { align: "right" });
    y += 18;
    doc.text(`سود کل: ${totalProfit.toLocaleString()} ؋`, doc.internal.pageSize.getWidth() - 40, y, { align: "right" });

    // ─── Page numbers (same as payments report) ──────────────────────
    const pageCount = doc.internal.getNumberOfPages();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(10);
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(`${i}/${pageCount}`, pageWidth - 40, pageHeight - 40, { align: "right" });
    }

    doc.save(`incomes_${moment().format("YYYY-MM-DD")}.pdf`);
  } catch (err) {
    console.error(err);
    alert("خطا در دریافت اطلاعات");
  } finally {
    setLoading(false);
  }
};



  return (
    <div className="p-6 flex flex-wrap items-center gap-4">
      <div>
        <label className="block text-sm font-medium">از تاریخ</label>
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="border p-2 rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">تا تاریخ</label>
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="border p-2 rounded"
        />
      </div>
      <button
        onClick={handlePDFDownload}
        disabled={loading || !fromDate || !toDate}
        className="bg-cyan-800 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? "در حال ساخت PDF..." : "دانلود PDF"}
      </button>
    </div>
  );
};

export default DateIncomeDownload;