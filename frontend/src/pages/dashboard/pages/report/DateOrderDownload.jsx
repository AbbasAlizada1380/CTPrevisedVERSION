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

const DateOrderDownload = () => {
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

      const { data } = await axios.get(
        `${BASE_URL}/orderItems/date_range`,
        {
          params: {
            from: fromDate,
            to: toDate,
          },
        }
      );

      if (!data?.data || data.data.length === 0) {
        alert("هیچ اطلاعاتی یافت نشد");
        return;
      }

      const items = data.data;

      // Calculate summary
      const totalCount = items.length;
      const totalMoney = items.reduce(
        (sum, item) => sum + Number(item.money || 0),
        0
      );
      const totalReceipt = items.reduce(
        (sum, item) => sum + Number(item.receipt || 0),
        0
      );
      const totalRemaining = totalMoney - totalReceipt;

      const doc = new jsPDF({
        orientation: "p",
        unit: "pt",
        format: "a4",
      });

      doc.setR2L(false);

      // Font
      doc.addFileToVFS("Vazirmatn.ttf", VazirmatnTTF);
      doc.addFont("Vazirmatn.ttf", "Vazirmatn", "normal");
      doc.setFont("Vazirmatn");

      // Title
      doc.setFontSize(14);
      doc.text(
        `گزارش سفارشات از ${fromDate} تا ${toDate}`,
        550,
        120,
        { align: "right" }
      );

      const headers = [
        ["باقیمانده", "دریافتی", "مبلغ", "مشتری", "نمبر بیل", "تعداد", "نام فایل", "سایز", "تاریخ", "شماره"]
      ];

      const body = items.map((item) => [
        (item.money - (item.receipt || 0)),
        (item.receipt || 0),
        (item.money),
        (item.customerName),
        (item.invoiceNumber),
        (item.qnty),
        (item.fileName),
        (item.size),
        moment(item.createdAt).format("YYYY/MM/DD"),
        (item.id),
      ]);

      autoTable(doc, {
        startY: 142,
        margin: {
          top: 142,
          bottom: 60  // قبلاً پیشفرض بود، حالا حدود 1cm بیشتر
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
      doc.text(`مجموع سفارشات: ${totalCount}`, 550, y, { align: "right" });
      doc.text(`مجموع مبلغ: ${totalMoney}`, 550, y + 18, { align: "right" });
      doc.text(`دریافتی: ${totalReceipt}`, 550, y + 36, { align: "right" });
      doc.text(`باقیمانده: ${totalRemaining}`, 550, y + 54, { align: "right" });
      doc.text(`صادر شده: ${today}`, 550, y + 72, { align: "right" });
      const pageCount = doc.internal.getNumberOfPages();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      doc.setFontSize(10);

      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);

        doc.text(
          `${i}/${pageCount}`,
          pageWidth - 40,        // فاصله از راست
          pageHeight - 40,       // فاصله از پایین
          { align: "right" }
        );
      }
      doc.save(
        `orders_${moment().format("YYYY-MM-DD")}.pdf`
      );

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

      const { data } = await axios.get(
        `${BASE_URL}/orderItems/date_range`,
        {
          params: {
            from: fromDate,
            to: toDate,
          },
        }
      );

      if (!data?.data || data.data.length === 0) {
        alert("هیچ اطلاعاتی یافت نشد");
        return;
      }

      const items = data.data;

      // Group items by customerName
      const customerGroups = items.reduce((groups, item) => {
        const customerName = item.customerName || "نامشخص";
        if (!groups[customerName]) {
          groups[customerName] = [];
        }
        groups[customerName].push(item);
        return groups;
      }, {});

      // Create a new workbook
      const workbook = XLSX.utils.book_new();

      // Process each customer group
      Object.keys(customerGroups).forEach((customerName) => {
        const customerItems = customerGroups[customerName];

        // Calculate customer totals
        const customerTotalMoney = customerItems.reduce(
          (sum, item) => sum + Number(item.money || 0),
          0
        );
        const customerTotalReceipt = customerItems.reduce(
          (sum, item) => sum + Number(item.receipt || 0),
          0
        );
        const customerTotalRemaining = customerTotalMoney - customerTotalReceipt;

        // Format data for this customer
        const formattedData = customerItems.map((item) => ({
          شماره: item.id,
          تاریخ: moment(item.createdAt).format("YYYY/MM/DD"),
          سایز: item.size,
          "نام فایل": item.fileName,
          تعداد: item.qnty,
          "نمبر بیل": item.invoiceNumber,
          مبلغ: item.money,
          دریافتی: item.receipt || 0,
          باقیمانده: item.money - (item.receipt || 0),
        }));

        // Add empty row for spacing
        formattedData.push({});

        // Add summary rows for this customer
        formattedData.push({
          شماره: "مجموع سفارشات این مشتری",
          تاریخ: customerItems.length,
        });
        formattedData.push({
          شماره: "مجموع مبلغ این مشتری",
          تاریخ: customerTotalMoney,
        });
        formattedData.push({
          شماره: "دریافتی این مشتری",
          تاریخ: customerTotalReceipt,
        });
        formattedData.push({
          شماره: "باقیمانده این مشتری",
          تاریخ: customerTotalRemaining,
        });

        // Convert to worksheet
        const worksheet = XLSX.utils.json_to_sheet(formattedData);

        // Set column widths (optional - for better formatting)
        const colWidths = [
          { wch: 15 }, // شماره
          { wch: 12 }, // تاریخ
          { wch: 10 }, // سایز
          { wch: 25 }, // نام فایل
          { wch: 8 },  // تعداد
          { wch: 15 }, // نمبر بیل
          { wch: 10 }, // مبلغ
          { wch: 10 }, // دریافتی
          { wch: 10 }, // باقیمانده
        ];
        worksheet['!cols'] = colWidths;

        // Clean customer name for sheet name (remove invalid characters)
        let sheetName = customerName.replace(/[\[\]:*?\/\\]/g, '_').substring(0, 31);

        // Append sheet to workbook with customer name
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      });

      // Create a summary sheet with overall totals AND the general table

      // Calculate overall totals
      const totalMoney = items.reduce(
        (sum, item) => sum + Number(item.money || 0),
        0
      );
      const totalReceipt = items.reduce(
        (sum, item) => sum + Number(item.receipt || 0),
        0
      );
      const totalRemaining = totalMoney - totalReceipt;

      // Create customer summary list with clear formatting
      const customerList = Object.keys(customerGroups).map(name => ([
        name,
        customerGroups[name].length.toString(),
        customerGroups[name].reduce((sum, item) => sum + Number(item.money || 0), 0).toLocaleString(),
        customerGroups[name].reduce((sum, item) => sum + Number(item.receipt || 0), 0).toLocaleString()
      ]));

      // Create summary data with proper structure
      const summaryData = [
        ["گزارش کلی", ""],
        ["بازه زمانی", `${moment(fromDate).format("YYYY/MM/DD")} تا ${moment(toDate).format("YYYY/MM/DD")}`],
        ["تعداد کل سفارشات", items.length],
        ["مجموع کل مبلغ", totalMoney.toLocaleString()],
        ["مجموع کل دریافتی", totalReceipt.toLocaleString()],
        ["مجموع کل باقیمانده", totalRemaining.toLocaleString()],
        [],
        ["لیست مشتریان", "تعداد سفارشات", "مجموع مبلغ", "مجموع دریافتی"],
        ...customerList,
        [],
        ["جدول کامل سفارشات", "", "", "", "", "", "", "", ""],
        ["شماره", "تاریخ", "سایز", "نام فایل", "تعداد", "نمبر بیل", "مشتری", "مبلغ", "دریافتی", "باقیمانده"]
      ];

      // Add all items to the summary data
      items.forEach(item => {
        summaryData.push([
          item.id,
          moment(item.createdAt).format("YYYY/MM/DD"),
          item.size || "-",
          item.fileName || "-",
          item.qnty,
          item.invoiceNumber || "-",
          item.customerName || "نامشخص",
          item.money?.toLocaleString() || "0",
          (item.receipt || 0).toLocaleString(),
          (item.money - (item.receipt || 0)).toLocaleString()
        ]);
      });

      // Add total row at the end
      summaryData.push([]);
      summaryData.push([
        "جمع کل",
        "",
        "",
        "",
        items.reduce((sum, item) => sum + (item.qnty || 0), 0),
        "",
        "",
        totalMoney.toLocaleString(),
        totalReceipt.toLocaleString(),
        totalRemaining.toLocaleString()
      ]);

      // Create worksheet from array of arrays
      const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryData);

      // Set column widths for summary sheet
      const summaryColWidths = [
        { wch: 15 }, // شماره/عنوان
        { wch: 12 }, // تاریخ
        { wch: 10 }, // سایز
        { wch: 25 }, // نام فایل
        { wch: 8 },  // تعداد
        { wch: 15 }, // نمبر بیل
        { wch: 20 }, // مشتری
        { wch: 15 }, // مبلغ
        { wch: 15 }, // دریافتی
        { wch: 15 }, // باقیمانده
      ];
      summaryWorksheet['!cols'] = summaryColWidths;

      XLSX.utils.book_append_sheet(workbook, summaryWorksheet, "خلاصه کل");

      // ===== NEW SHEET: Size Statistics =====
      
      // Count sizes across all items
      const sizeCounts = {};
      items.forEach(item => {
        const size = item.size || "نامشخص";
        if (!sizeCounts[size]) {
          sizeCounts[size] = {
            count: 0,
            totalQuantity: 0,
            totalMoney: 0,
            items: []
          };
        }
        sizeCounts[size].count += 1;
        sizeCounts[size].totalQuantity += item.qnty || 0;
        sizeCounts[size].totalMoney += Number(item.money || 0);
        sizeCounts[size].items.push(item);
      });

      // Create size statistics data
      const sizeStatsData = [
        ["آمار سایزهای دانلود شده", ""],
        ["بازه زمانی", `${moment(fromDate).format("YYYY/MM/DD")} تا ${moment(toDate).format("YYYY/MM/DD")}`],
        [],
        ["ردیف", "سایز", "تعداد سفارشات", "تعداد کل آیتم‌ها", "مجموع مبلغ", "درصد از کل سفارشات", "مشتریان"],
      ];

      // Add size statistics rows
      let rowIndex = 1;
      const sortedSizes = Object.keys(sizeCounts).sort();
      
      sortedSizes.forEach(size => {
        const stats = sizeCounts[size];
        const percentage = ((stats.count / items.length) * 100).toFixed(1);
        
        // Get unique customers for this size
        const uniqueCustomers = [...new Set(stats.items.map(item => item.customerName || "نامشخص"))];
        const customersList = uniqueCustomers.join("، ");
        
        sizeStatsData.push([
          rowIndex++,
          size,
          stats.count,
          stats.totalQuantity,
          stats.totalMoney.toLocaleString(),
          `${percentage}%`,
          customersList
        ]);
      });

      // Add summary row
      sizeStatsData.push([]);
      sizeStatsData.push([
        "جمع کل",
        "",
        items.length,
        items.reduce((sum, item) => sum + (item.qnty || 0), 0),
        totalMoney.toLocaleString(),
        "100%",
        Object.keys(customerGroups).length
      ]);

      // Create size statistics worksheet
      const sizeStatsWorksheet = XLSX.utils.aoa_to_sheet(sizeStatsData);

      // Set column widths for size statistics sheet
      const sizeStatsColWidths = [
        { wch: 8 },   // ردیف
        { wch: 15 },  // سایز
        { wch: 15 },  // تعداد سفارشات
        { wch: 15 },  // تعداد کل آیتم‌ها
        { wch: 15 },  // مجموع مبلغ
        { wch: 15 },  // درصد
        { wch: 50 },  // مشتریان
      ];
      sizeStatsWorksheet['!cols'] = sizeStatsColWidths;

      XLSX.utils.book_append_sheet(workbook, sizeStatsWorksheet, "آمار سایزها");

      // ===== END OF NEW SHEET =====

      // Write workbook to buffer
      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      // Create blob and download
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
      });

      saveAs(
        blob,
        `orders_grouped_by_customer_${moment().format("YYYY-MM-DD")}.xlsx`
      );

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

export default DateOrderDownload;
