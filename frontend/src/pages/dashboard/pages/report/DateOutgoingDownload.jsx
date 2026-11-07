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

const DateOutgoingDownload = () => {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);

  const parseNumber = (val) => parseFloat(val) || 0;

  const fetchOutgoings = async () => {
    const params = new URLSearchParams();
    if (fromDate) params.append("from", fromDate);
    if (toDate) params.append("to", toDate);
    params.append("limit", "100000");

    const res = await axios.get(`${BASE_URL}/stock/outgoing/date-range?${params.toString()}`);
    return res.data.outgoings || [];
  };

  // ─── PDF Handler ──────────────────────────────────────────────────────
  const handlePDFDownload = async () => {
    if (!fromDate || !toDate) {
      alert("لطفاً بازه زمانی را انتخاب کنید");
      return;
    }

    try {
      setLoading(true);
      const outgoings = await fetchOutgoings();

      if (!outgoings.length) {
        alert("هیچ خروجی در این بازه یافت نشد");
        return;
      }

      // ─── Overall totals ──────────────────────────────────────────────
      const totalQuantity = outgoings.reduce((sum, o) => sum + parseNumber(o.quantity), 0);
      const totalMoney = outgoings.reduce((sum, o) => sum + parseNumber(o.money), 0);

      // ─── Size summary ──────────────────────────────────────────────────
      const sizeMap = outgoings.reduce((acc, o) => {
        const size = o.size || "بدون سایز";
        if (!acc[size]) {
          acc[size] = { size, totalQuantity: 0, totalMoney: 0 };
        }
        acc[size].totalQuantity += parseNumber(o.quantity);
        acc[size].totalMoney += parseNumber(o.money);
        return acc;
      }, {});
      const sizeSummary = Object.values(sizeMap).map((s) => ({
        ...s,
        averagePrice: s.totalQuantity > 0 ? (s.totalMoney / s.totalQuantity) : 0,
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

      // Title
      doc.setFontSize(14);
      doc.text(`گزارش خروجی‌ها (${dateRangeStr})`, doc.internal.pageSize.getWidth() - 40, 120, { align: "right" });
      doc.setFontSize(10);
      doc.text(`تاریخ تهیه: ${today}`, doc.internal.pageSize.getWidth() - 40, 140, { align: "right" });

      // ─── Main table ──────────────────────────────────────────────────
      const headers = [
        ["شناسه", "سایز", "تعداد", "مبلغ کل (؋)", "قیمت متوسط (؋)", "تاریخ"]
      ];
      const body = outgoings.map((o) => {
        const qty = parseNumber(o.quantity);
        const money = parseNumber(o.money);
        const avgPrice = qty > 0 ? (money / qty) : 0;
        return [
          o.id,
          o.size || "—",
          qty.toLocaleString(),
          money.toLocaleString(),
          avgPrice.toFixed(2),
          moment(o.createdAt).format("YYYY/MM/DD"),
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

        const sizeHeaders = [["سایز", "تعداد کل", ]];
        const sizeBody = sizeSummary.map((s) => [
          s.size,
          s.totalQuantity.toLocaleString()
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
      doc.text(`تعداد کل خروجی‌ها: ${outgoings.length}`, doc.internal.pageSize.getWidth() - 40, y, { align: "right" });
      y += 18;
      doc.text(`مجموع تعداد: ${totalQuantity.toLocaleString()}`, doc.internal.pageSize.getWidth() - 40, y, { align: "right" });
      y += 18;
      doc.text(`مجموع مبلغ: ${totalMoney.toLocaleString()} ؋`, doc.internal.pageSize.getWidth() - 40, y, { align: "right" });

      // ─── Page numbers ──────────────────────────────────────────────────
      const pageCount = doc.internal.getNumberOfPages();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFontSize(10);
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(`${i}/${pageCount}`, pageWidth - 40, pageHeight - 40, { align: "right" });
      }

      doc.save(`outgoings_${moment().format("YYYY-MM-DD")}.pdf`);
    } catch (err) {
      console.error(err);
      alert("خطا در دریافت اطلاعات");
    } finally {
      setLoading(false);
    }
  };

  // ─── Excel Handler ──────────────────────────────────────────────────────
  const handleExcelDownload = async () => {
    if (!fromDate || !toDate) {
      alert("لطفاً بازه زمانی را انتخاب کنید");
      return;
    }

    try {
      setLoading(true);
      const outgoings = await fetchOutgoings();

      if (!outgoings.length) {
        alert("هیچ خروجی در این بازه یافت نشد");
        return;
      }

      const totalQuantity = outgoings.reduce((sum, o) => sum + parseNumber(o.quantity), 0);
      const totalMoney = outgoings.reduce((sum, o) => sum + parseNumber(o.money), 0);

      // ─── Size breakdown ──────────────────────────────────────────────
      const sizeMap = outgoings.reduce((acc, o) => {
        const size = o.size || "بدون سایز";
        if (!acc[size]) {
          acc[size] = { size, count: 0, totalQuantity: 0, totalMoney: 0 };
        }
        acc[size].count++;
        acc[size].totalQuantity += parseNumber(o.quantity);
        acc[size].totalMoney += parseNumber(o.money);
        return acc;
      }, {});

      const workbook = XLSX.utils.book_new();

      // ─── Summary sheet ──────────────────────────────────────────────────
      const summaryData = [
        ["گزارش خروجی‌ها"],
        [`بازه: ${moment(fromDate).format("YYYY/MM/DD")} – ${moment(toDate).format("YYYY/MM/DD")}`],
        [],
        ["تعداد کل خروجی‌ها", outgoings.length],
        ["مجموع تعداد", totalQuantity.toLocaleString()],
        ["مجموع مبلغ (؋)", totalMoney.toLocaleString()],
        [],
        ["خلاصه سایزها"],
        ["سایز", "تعداد رکورد", "تعداد کل", "مجموع مبلغ (؋)"],
      ];
      Object.values(sizeMap).forEach((s) => {
        summaryData.push([s.size, s.count, s.totalQuantity.toLocaleString(), s.totalMoney.toLocaleString()]);
      });
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      summarySheet["!cols"] = [{ wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(workbook, summarySheet, "خلاصه");

      // ─── Details sheet ──────────────────────────────────────────────────
      const detailData = [
        ["شناسه", "سایز", "تعداد", "مبلغ کل (؋)", "قیمت متوسط (؋)", "تاریخ"],
      ];
      outgoings.forEach((o) => {
        const qty = parseNumber(o.quantity);
        const money = parseNumber(o.money);
        const avgPrice = qty > 0 ? (money / qty) : 0;
        detailData.push([
          o.id,
          o.size || "—",
          qty.toLocaleString(),
          money.toLocaleString(),
          avgPrice.toFixed(2),
          moment(o.createdAt).format("YYYY/MM/DD HH:mm"),
        ]);
      });
      const detailSheet = XLSX.utils.aoa_to_sheet(detailData);
      detailSheet["!cols"] = [{ wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 18 }];
      XLSX.utils.book_append_sheet(workbook, detailSheet, "جزئیات");

      // ─── Daily statistics ──────────────────────────────────────────────
      const dateStats = outgoings.reduce((acc, o) => {
        const date = moment(o.createdAt).format("YYYY/MM/DD");
        if (!acc[date]) acc[date] = { count: 0, qty: 0, money: 0 };
        acc[date].count++;
        acc[date].qty += parseNumber(o.quantity);
        acc[date].money += parseNumber(o.money);
        return acc;
      }, {});
      const statsData = [
        ["آمار روزانه"],
        ["تاریخ", "تعداد خروجی‌ها", "تعداد کل", "مجموع مبلغ (؋)"],
      ];
      Object.entries(dateStats).forEach(([date, stats]) => {
        statsData.push([date, stats.count, stats.qty.toLocaleString(), stats.money.toLocaleString()]);
      });
      const statsSheet = XLSX.utils.aoa_to_sheet(statsData);
      statsSheet["!cols"] = [{ wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(workbook, statsSheet, "آمار روزانه");

      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
      saveAs(blob, `outgoings_${moment().format("YYYY-MM-DD")}.xlsx`);
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
      <button
        onClick={handleExcelDownload}
        disabled={loading || !fromDate || !toDate}
        className="bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? "در حال ساخت Excel..." : "دانلود Excel"}
      </button>
    </div>
  );
};

export default DateOutgoingDownload;