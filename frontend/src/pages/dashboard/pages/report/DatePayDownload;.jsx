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

const DatePayDownload = () => {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    if (!fromDate || !toDate) {
      alert("لطفاً بازه زمانی را انتخاب کنید");
      return;
    }

    try {
      setLoading(true);

      const { data } = await axios.get(`${BASE_URL}/pays/date-range`, {
        params: { from: fromDate, to: toDate },
      });

      if (!data?.success || !data.data?.pays?.length) {
        alert("هیچ پرداختی در این بازه یافت نشد");
        return;
      }

      const pays = data.data.pays;

      // Calculate summary
      const totalCount = pays.length;
      const totalAmount = pays.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const totalAmountFormatted = totalAmount.toLocaleString();

      const doc = new jsPDF({
        orientation: "p",
        unit: "pt",
        format: "a4",
      });

      doc.setR2L(false); // Left to right, but we align text right

      // Font
      doc.addFileToVFS("Vazirmatn.ttf", VazirmatnTTF);
      doc.addFont("Vazirmatn.ttf", "Vazirmatn", "normal");
      doc.setFont("Vazirmatn");

      // Title
      doc.setFontSize(14);
      doc.text(
        `گزارش پرداخت‌ها از ${fromDate} تا ${toDate}`,
        550,
        120,
        { align: "right" }
      );

      const headers = [["شماره", "فروشنده", "مبلغ (افغانی)", "توضیحات", "تاریخ"]];
      const body = pays.map((pay) => [
        pay.id,
        pay.sellerInfo.fullname,
        pay.amount,           // plain number – no formatting
        pay.description || "—",
        moment(pay.createdAt).format("YYYY/MM/DD"),
      ]);

      autoTable(doc, {
        startY: 142,
        margin: {
          top: 142,
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
        },
        headStyles: {
          font: "Vazirmatn",
          fontStyle: "normal",
          fillColor: [220, 220, 220],
          textColor: 20,
          halign: "center",
        },
      });

      const today = moment().format("YYYY/MM/DD");
      const y = doc.lastAutoTable.finalY + 30;

      doc.setFontSize(11);
      doc.text(`تعداد پرداخت‌ها: ${totalCount}`, 550, y, { align: "right" });
      doc.text(`مجموع مبلغ: ${totalAmountFormatted} افغانی`, 550, y + 18, { align: "right" });
      doc.text(`تاریخ تهیه گزارش: ${today}`, 550, y + 36, { align: "right" });

      const pageCount = doc.internal.getNumberOfPages();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      doc.setFontSize(10);
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(`${i}/${pageCount}`, pageWidth - 40, pageHeight - 40, { align: "right" });
      }

      doc.save(`pays_${moment().format("YYYY-MM-DD")}.pdf`);
    } catch (err) {
      console.error(err);
      alert("خطا در دریافت اطلاعات");
    } finally {
      setLoading(false);
    }
  };

  const handleExcelDownload = async () => {
    if (!fromDate || !toDate) {
      alert("لطفاً بازه زمانی را انتخاب کنید");
      return;
    }

    try {
      setLoading(true);

      const { data } = await axios.get(`${BASE_URL}/pays/date-range`, {
        params: { from: fromDate, to: toDate },
      });

      if (!data?.success || !data.data?.pays?.length) {
        alert("هیچ پرداختی در این بازه یافت نشد");
        return;
      }

      const pays = data.data.pays;
      const totalAmount = pays.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const totalCount = pays.length;

      // Group by seller
      const sellerGroups = pays.reduce((groups, pay) => {
        const sellerId = pay.seller;
        if (!groups[sellerId]) groups[sellerId] = [];
        groups[sellerId].push(pay);
        return groups;
      }, {});

      const workbook = XLSX.utils.book_new();

      // 1. Summary sheet (like the order version)
      const summaryData = [
        ["گزارش پرداخت‌ها", ""],
        ["بازه زمانی", `${moment(fromDate).format("YYYY/MM/DD")} تا ${moment(toDate).format("YYYY/MM/DD")}`],
        ["تعداد کل پرداخت‌ها", totalCount],
        ["مجموع کل مبلغ", totalAmount.toLocaleString() + " افغانی"],
        [],
        ["لیست فروشندگان", "تعداد پرداخت‌ها", "مجموع مبلغ (افغانی)"],
      ];

      for (const [sellerId, items] of Object.entries(sellerGroups)) {
        const sellerTotal = items.reduce((sum, p) => sum + Number(p.amount), 0);
        summaryData.push([sellerId, items.length, sellerTotal.toLocaleString()]);
      }

      summaryData.push([], ["جزئیات کامل پرداخت‌ها"]);
      summaryData.push(["شناسه", "فروشنده", "مبلغ (افغانی)", "توضیحات", "تاریخ"]);

      pays.forEach((pay) => {
        summaryData.push([
          pay.id,
          pay.seller,
          Number(pay.amount).toLocaleString(),
          pay.description || "—",
          moment(pay.createdAt).format("YYYY/MM/DD"),
        ]);
      });

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      summarySheet["!cols"] = [{ wch: 10 }, { wch: 15 }, { wch: 20 }, { wch: 30 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(workbook, summarySheet, "خلاصه کل");

      // 2. Separate sheets per seller
      for (const [sellerId, items] of Object.entries(sellerGroups)) {
        const sellerTotal = items.reduce((sum, p) => sum + Number(p.amount), 0);
        const sellerData = [
          [`پرداخت‌های فروشنده ${sellerId}`],
          [`مجموع مبلغ: ${sellerTotal.toLocaleString()} افغانی`],
          [],
          ["شناسه", "مبلغ (افغانی)", "توضیحات", "تاریخ"],
        ];
        items.forEach((pay) => {
          sellerData.push([
            pay.id,
            Number(pay.amount).toLocaleString(),
            pay.description || "—",
            moment(pay.createdAt).format("YYYY/MM/DD"),
          ]);
        });
        const sellerSheet = XLSX.utils.aoa_to_sheet(sellerData);
        sellerSheet["!cols"] = [{ wch: 10 }, { wch: 15 }, { wch: 30 }, { wch: 15 }];
        let sheetName = `seller_${sellerId}`.substring(0, 31);
        XLSX.utils.book_append_sheet(workbook, sellerSheet, sheetName);
      }

      // 3. Daily statistics sheet
      const dateStats = pays.reduce((acc, pay) => {
        const date = moment(pay.createdAt).format("YYYY/MM/DD");
        if (!acc[date]) acc[date] = { count: 0, total: 0 };
        acc[date].count++;
        acc[date].total += Number(pay.amount);
        return acc;
      }, {});

      const statsSheetData = [["آمار روزانه پرداخت‌ها"], ["تاریخ", "تعداد پرداخت‌ها", "مبلغ کل (افغانی)"]];
      Object.entries(dateStats).forEach(([date, stats]) => {
        statsSheetData.push([date, stats.count, stats.total.toLocaleString()]);
      });
      const statsSheet = XLSX.utils.aoa_to_sheet(statsSheetData);
      statsSheet["!cols"] = [{ wch: 15 }, { wch: 15 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(workbook, statsSheet, "آمار روزانه");

      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
      });
      saveAs(blob, `pays_${moment().format("YYYY-MM-DD")}.xlsx`);
    } catch (err) {
      console.error(err);
      alert("خطا در دریافت اطلاعات");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 flex items-center gap-4">
      <input
        type="date"
        value={fromDate}
        onChange={(e) => setFromDate(e.target.value)}
        className="border p-2 rounded"
      />
      <input
        type="date"
        value={toDate}
        onChange={(e) => setToDate(e.target.value)}
        className="border p-2 rounded"
      />
      <button
        onClick={handleDownload}
        disabled={loading}
        className="bg-cyan-800 text-white px-4 py-2 rounded"
      >
        {loading ? "در حال ساخت PDF..." : "دانلود PDF"}
      </button>
      <button
        onClick={handleExcelDownload}
        disabled={loading}
        className="bg-green-700 text-white px-4 py-2 rounded"
      >
        {loading ? "در حال ساخت Excel..." : "دانلود Excel"}
      </button>
    </div>
  );
};

export default DatePayDownload;