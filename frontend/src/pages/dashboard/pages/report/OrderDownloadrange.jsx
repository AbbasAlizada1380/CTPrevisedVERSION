import React, { useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import moment from "moment-jalaali";

import VazirmatnTTF from "../../../../../public/ttf/Vazirmatn.js";
moment.locale("en");
const BASE_URL = import.meta.env.VITE_BASE_URL;

const OrderDownloadrange = ({ customerId }) => {
    const [type, setType] = useState("");
    const [dateRange, setDateRange] = useState({
        from: "",
        to: ""
    });
    const [loading, setLoading] = useState(false);

    const handleDownload = async () => {
        if (!type) {
            alert("لطفاً نوع گزارش را انتخاب کنید");
            return;
        }

        // Validate date range if type is "dateRange"
        if (type === "dateRange") {
            if (!dateRange.from || !dateRange.to) {
                alert("لطفاً بازه زمانی را مشخص کنید");
                return;
            }

            const fromDate = new Date(dateRange.from);
            const toDate = new Date(dateRange.to);

            if (fromDate > toDate) {
                alert("تاریخ شروع نمی‌تواند بزرگتر از تاریخ پایان باشد");
                return;
            }
        }

        try {
            setLoading(true);

            let data;

            if (type === "dateRange") {
                const response = await axios.get(
                    `${BASE_URL}/orderItems/customer/${customerId}/date_range`,
                    {
                        params: {
                            from: dateRange.from,
                            to: dateRange.to
                        }
                    }
                );
                data = response.data.data;
            } else {
                const response = await axios.get(
                    `${BASE_URL}/orderItems/${customerId}/${type}`
                );
                data = response.data;
            }

            const items = type === "dateRange" ? data.items : data.items || [];
            const customerName = type === "dateRange"
                ? data.customer?.fullname
                : data.customerName || "مشتری";
            const totalCount = type === "dateRange"
                ? data.summary?.totalItems
                : data.totalCount || items.length;
            const totalMoney = type === "dateRange"
                ? data.summary?.totalMoney
                : data.totalMoney || 0;
            const totalReceipt = type === "dateRange"
                ? data.summary?.totalReceipt
                : data.totalReceipt || 0;
            const totalRemaining = type === "dateRange"
                ? data.summary?.totalRemaining
                : data.totalRemaining || 0;

            if (!items || items.length === 0) {
                alert("هیچ اطلاعاتی یافت نشد");
                return;
            }

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

            // Title with date range if applicable - Using Gregorian format
            let titleText = `گزارش ${getTypeTitle(type)} - ${customerName}`;
            if (type === "dateRange" && dateRange.from && dateRange.to) {
                // Format dates in Gregorian (YYYY/M/D)
                const fromFormatted = moment(dateRange.from).format("YYYY/M/D");
                const toFormatted = moment(dateRange.to).format("YYYY/M/D");
                titleText = `گزارش سفارشات از ${fromFormatted} تا ${toFormatted} - ${customerName}`;
            }

            doc.setFontSize(14);
            // Adjust title position to be right-aligned with proper margin
            doc.text(titleText, doc.internal.pageSize.width - 40, 120, { align: "right" });

            // Table headers
            const headers = [
                ["باقیمانده", "دریافتی", "مبلغ", "تعداد", "نام فایل", "سایز", "تاریخ", "شماره"]
            ];

            // Table body - Using Gregorian format for dates
            const body = items.map((item) => [
                item.remaining?.toLocaleString() || "0",
                item.receipt?.toLocaleString() || "0",
                item.money?.toLocaleString() || "0",
                item.qnty?.toLocaleString() || "0",
                item.fileName || "-",
                item.size || "-",
                moment(item.createdAt).format("YYYY/M/D"), // Changed to Gregorian format
                item.id?.toString().slice(-8) || "-", // Show last 8 digits of ID for better fit
            ]);

            // Calculate available width (A4 width is 595pt, subtract minimal margins)
            const pageWidth = doc.internal.pageSize.width;
            const margin = 20; // Minimal margin from sides (20pt on each side)
            const tableWidth = pageWidth - (margin * 2);

            // Calculate column widths based on content priority
            const columnWidths = {
                0: tableWidth * 0.12, // باقیمانده - 12%
                1: tableWidth * 0.12, // دریافتی - 12%
                2: tableWidth * 0.12, // مبلغ - 12%
                3: tableWidth * 0.10, // تعداد - 10%
                4: tableWidth * 0.18, // نام فایل - 18% (more space for filenames)
                5: tableWidth * 0.10, // سایز - 10%
                6: tableWidth * 0.14, // تاریخ - 14%
                7: tableWidth * 0.12, // شماره - 12%
            };

            autoTable(doc, {
                startY: 140, // Start table position from top
                margin: {
                    left: margin,
                    right: margin,
                    top: 140,
                    bottom: 80
                },
                head: headers,
                body: body,
                styles: {
                    font: "Vazirmatn",
                    fontSize: 8, // Slightly smaller font to fit better
                    halign: "center",
                    valign: "middle",
                    cellPadding: 3,
                    lineColor: [200, 200, 200],
                    lineWidth: 0.5,
                },
                headStyles: {
                    font: "Vazirmatn",
                    fontStyle: "normal",
                    fillColor: [220, 220, 220],
                    textColor: 20,
                    halign: "center",
                    fontSize: 9,
                },
                columnStyles: {
                    0: { cellWidth: columnWidths[0] }, // باقیمانده
                    1: { cellWidth: columnWidths[1] }, // دریافتی
                    2: { cellWidth: columnWidths[2] }, // مبلغ
                    3: { cellWidth: columnWidths[3] }, // تعداد
                    4: { cellWidth: columnWidths[4] }, // نام فایل
                    5: { cellWidth: columnWidths[5] }, // سایز
                    6: { cellWidth: columnWidths[6] }, // تاریخ
                    7: { cellWidth: columnWidths[7] }, // شماره
                },
            });

            const today = moment().format("YYYY/M/D"); // Changed to Gregorian format
            const y = doc.lastAutoTable.finalY + 30;

            // Summary section with right alignment and proper margins
            doc.setFontSize(11);

            // Create summary text with better formatting
            const summaryX = pageWidth - margin; // Right-aligned X position

            doc.text(`مجموع سفارشات: ${totalCount}`, summaryX, y, { align: "right" });
            doc.text(`مجموع مبلغ: ${totalMoney?.toLocaleString()} افغانی`, summaryX, y + 18, { align: "right" });
            doc.text(`دریافتی: ${totalReceipt?.toLocaleString()} افغانی`, summaryX, y + 36, { align: "right" });
            doc.text(`باقیمانده: ${totalRemaining?.toLocaleString()} افغانی`, summaryX, y + 54, { align: "right" });

            if (type === "dateRange") {
                // Format dates in Gregorian for the summary
                const fromFormatted = moment(dateRange.from).format("YYYY/M/D");
                const toFormatted = moment(dateRange.to).format("YYYY/M/D");
                doc.text(`بازه زمانی: ${fromFormatted} تا ${toFormatted}`, summaryX, y + 72, { align: "right" });
                doc.text(`صادر شده: ${today}`, summaryX, y + 90, { align: "right" });
            } else {
                doc.text(`صادر شده: ${today}`, summaryX, y + 72, { align: "right" });
            }

            // Add page numbers
            const pageCount = doc.internal.getNumberOfPages();
            const pageHeight = doc.internal.pageSize.height;

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

            // Generate filename - Using Gregorian format in filename
            let filename = `${type}_${customerName}_${moment().format("YYYY-M-D")}`;
            if (type === "dateRange") {
                const fromFormatted = moment(dateRange.from).format("YYYY-M-D");
                const toFormatted = moment(dateRange.to).format("YYYY-M-D");
                filename = `orders_${fromFormatted}_to_${toFormatted}_${customerName}.pdf`;
            } else {
                filename = `${type}_${customerName}_${moment().format("YYYY-M-D")}.pdf`;
            }

            doc.save(filename);

        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "خطا در دریافت اطلاعات");
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="p-6 space-y-4">
            <div className="flex items-center gap-4">
                <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="border p-2 rounded bg-white text-black"
                >
                    <option value="" className="text-black bg-white">
                        انتخاب نوع گزارش
                    </option>
                    <option value="orderId" className="text-black bg-white">
                        تمام سفارشات
                    </option>
                    <option value="receiptOrders" className="text-black bg-white">
                        سفارشات پرداخت‌شده
                    </option>
                    <option value="remainOrders" className="text-black bg-white">
                        سفارشات باقیمانده
                    </option>
                    <option value="dateRange" className="text-black bg-white">
                        بازه زمانی
                    </option>
                </select>

                <button
                    onClick={handleDownload}
                    disabled={loading}
                    className="bg-cyan-800 text-white px-4 py-2 rounded disabled:bg-gray-400"
                >
                    {loading ? "در حال ساخت PDF..." : "دانلود PDF"}
                </button>
            </div>

            {/* Date Range Inputs - Show only when dateRange is selected */}
            {type === "dateRange" && (
                <div className="flex items-center gap-4 mt-4">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">از تاریخ:</label>
                        <input
                            type="date"
                            value={dateRange.from}
                            onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                            className="border p-2 rounded bg-white text-black"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">تا تاریخ:</label>
                        <input
                            type="date"
                            value={dateRange.to}
                            onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                            className="border p-2 rounded bg-white text-black"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderDownloadrange;

// helpers
function getTypeTitle(type) {
    switch (type) {
        case "orderId":
            return "تمام سفارشات";
        case "receiptOrders":
            return "سفارشات پرداخت‌شده";
        case "remainOrders":
            return "سفارشات باقیمانده";
        case "dateRange":
            return "بازه زمانی";
        default:
            return "";
    }
}