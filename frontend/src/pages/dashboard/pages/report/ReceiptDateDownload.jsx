import React, { useState, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import moment from "moment-jalaali";

import VazirmatnTTF from "../../../../../public/ttf/Vazirmatn.js";

moment.locale("en");
const BASE_URL = import.meta.env.VITE_BASE_URL;

const ReceiptDateDownload = () => {
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingCustomers, setLoadingCustomers] = useState(false);

    // Fetch customers on component mount
    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        setLoadingCustomers(true);
        try {
            const res = await axios.get(`${BASE_URL}/customers?limit=200`);
            setCustomers(res.data.customers || []);
        } catch (err) {
            console.error("Error fetching customers:", err);
        } finally {
            setLoadingCustomers(false);
        }
    };

    const handleDownload = async () => {
        if (!from || !to) {
            alert("لطفاً بازه زمانی را انتخاب کنید");
            return;
        }

        // Validate date range
        const fromDate = new Date(from);
        const toDate = new Date(to);

        if (fromDate > toDate) {
            alert("تاریخ شروع نمی‌تواند بزرگتر از تاریخ پایان باشد");
            return;
        }

        try {
            setLoading(true);

            // Build params with optional customer filter
            const params = { from, to };
            if (selectedCustomer) {
                params.customerId = selectedCustomer;
            }

            const response = await axios.get(`${BASE_URL}/receipts/date_range`, {
                params,
            });

            // Extract data from the response structure
            const { data } = response.data;

            if (!data?.receipts || data.receipts.length === 0) {
                alert("هیچ رسیدی در این بازه یافت نشد");
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

            // Format dates in Gregorian
            const formattedFrom = moment(from).format("YYYY/M/D");
            const formattedTo = moment(to).format("YYYY/M/D");
            const today = moment().format("YYYY/M/D");

            // Get selected customer name for display
            const selectedCustomerName = selectedCustomer
                ? customers.find(c => c.id === parseInt(selectedCustomer))?.fullname
                : "همه مشتریان";

            // Title with date range
            let titleText = `گزارش رسیدها از ${formattedFrom} تا ${formattedTo}`;
            if (selectedCustomerName !== "همه مشتریان") {
                titleText += ` - ${selectedCustomerName}`;
            }

            doc.setFontSize(14);
            doc.text(titleText, doc.internal.pageSize.width - 40, 120, { align: "right" });

            // Table headers
            const headers = [
                ["مبلغ (افغانی)", "مشتری", "تاریخ", "شماره رسید"]
            ];

            // Table body - Using Gregorian format for dates
            const body = data.receipts.map((receipt) => [
                parseFloat(receipt.amount).toLocaleString(),
                receipt.Customer?.fullname || "نامشخص",
                moment(receipt.createdAt).format("YYYY/M/D"),
                receipt.id.toString().slice(-8) || "-", // Show last 8 digits of ID for better fit
            ]);

            // Calculate available width
            const pageWidth = doc.internal.pageSize.width;
            const margin = 20;
            const tableWidth = pageWidth - (margin * 2);

            // Calculate column widths
            const columnWidths = {
                0: tableWidth * 0.30, // مبلغ - 30%
                1: tableWidth * 0.30, // مشتری - 30%
                2: tableWidth * 0.20, // تاریخ - 20%
                3: tableWidth * 0.20, // شماره رسید - 20%
            };

            autoTable(doc, {
                startY: 140,
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
                    fontSize: 9,
                    halign: "center",
                    valign: "middle",
                    cellPadding: 4,
                    lineColor: [200, 200, 200],
                    lineWidth: 0.5,
                },
                headStyles: {
                    font: "Vazirmatn",
                    fontStyle: "normal",
                    fillColor: [220, 220, 220],
                    textColor: 20,
                    halign: "center",
                    fontSize: 10,
                },
                columnStyles: {
                    0: { cellWidth: columnWidths[0] },
                    1: { cellWidth: columnWidths[1] },
                    2: { cellWidth: columnWidths[2] },
                    3: { cellWidth: columnWidths[3] },
                },
            });

            const y = doc.lastAutoTable.finalY + 30;
            const summaryX = pageWidth - margin;

            // Summary section
            doc.setFontSize(11);

            doc.text(`تعداد کل رسیدها: ${data.totalCount || 0}`, summaryX, y, { align: "right" });
            doc.text(`جمع کل مبلغ: ${(data.totalAmount || 0).toLocaleString()} افغانی`, summaryX, y + 18, { align: "right" });

            // Date range and export info
            doc.text(`بازه زمانی: ${formattedFrom} تا ${formattedTo}`, summaryX, y + 36, { align: "right" });
            doc.text(`صادر شده: ${today}`, summaryX, y + 54, { align: "right" });

            // Add page numbers
            const pageCount = doc.internal.getNumberOfPages();
            const pageHeight = doc.internal.pageSize.height;

            doc.setFontSize(10);

            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.text(
                    `${i}/${pageCount}`,
                    pageWidth - 40,
                    pageHeight - 40,
                    { align: "right" }
                );
            }

            // Generate filename
            const customerPart = selectedCustomerName !== "همه مشتریان" ? `_${selectedCustomerName}` : "";
            const filename = `receipts_${formattedFrom}_to_${formattedTo}${customerPart}_${today}.pdf`;

            doc.save(filename);

        } catch (err) {
            console.error("Error downloading receipts:", err);
            alert(err.response?.data?.message || "خطا در دریافت اطلاعات");
        } finally {
            setLoading(false);
        }
    };
    return (
<div className="p-4 sm:p-6 space-y-4 bg-white rounded-lg shadow">
    <h2 className="text-lg sm:text-xl font-semibold text-gray-800">دانلود گزارش رسیدها</h2>

    <div className="space-y-4">
        {/* Customer Selection */}
        <div className="grid grid-cols-1 gap-2">
            <label className="text-sm font-medium text-gray-700">انتخاب مشتری</label>
            <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="w-full border p-2.5 rounded bg-white text-black"
                disabled={loadingCustomers}
            >
                <option value="" className="text-black bg-white">
                    همه مشتریان
                </option>
                {customers.map((customer) => (
                    <option key={customer.id} value={customer.id} className="text-black bg-white">
                        {customer.fullname} {customer.phoneNumber ? `- ${customer.phoneNumber}` : ''}
                    </option>
                ))}
            </select>
            {loadingCustomers && (
                <span className="text-sm text-gray-500">در حال بارگذاری...</span>
            )}
        </div>

        {/* Date Range Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">از تاریخ</label>
                <input
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="w-full border p-2.5 rounded bg-white text-black"
                />
            </div>
            <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">تا تاریخ</label>
                <input
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="w-full border p-2.5 rounded bg-white text-black"
                />
            </div>
        </div>

        {/* Download Button */}
        <button
            onClick={handleDownload}
            disabled={loading || !from || !to}
            className="w-full bg-cyan-800 text-white px-6 py-3 rounded hover:bg-cyan-700 disabled:bg-gray-400 transition-colors text-sm sm:text-base font-medium"
        >
            {loading ? (
                <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>در حال ساخت PDF...</span>
                </span>
            ) : "دانلود گزارش رسیدها"}
        </button>

        {/* Selected Filters Display */}
        {(selectedCustomer || from || to) && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                <p className="font-medium mb-2">فیلترهای اعمال شده:</p>
                <ul className="list-disc list-inside space-y-1">
                    {selectedCustomer && (
                        <li className="break-words text-xs sm:text-sm">
                            مشتری: {customers.find(c => c.id === parseInt(selectedCustomer))?.fullname || 'همه مشتریان'}
                        </li>
                    )}
                    {from && (
                        <li className="break-words text-xs sm:text-sm">
                            از تاریخ: {moment(from).format('YYYY/M/D')}
                        </li>
                    )}
                    {to && (
                        <li className="break-words text-xs sm:text-sm">
                            تا تاریخ: {moment(to).format('YYYY/M/D')}
                        </li>
                    )}
                </ul>
            </div>
        )}
    </div>
</div>
    );
};

export default ReceiptDateDownload;