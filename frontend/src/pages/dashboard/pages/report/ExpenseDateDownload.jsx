import React, { useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import moment from "moment-jalaali";

import VazirmatnTTF from "../../../../../public/ttf/Vazirmatn.js";

moment.locale("en");

const BASE_URL = import.meta.env.VITE_BASE_URL;

const ExpenseDateDownload = () => {
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [loading, setLoading] = useState(false);

    const handleDownload = async () => {
        if (!from || !to) {
            alert("لطفاً بازه زمانی را انتخاب کنید");
            return;
        }

        try {
            setLoading(true);

            const { data } = await axios.get(`${BASE_URL}/expense/date_range`, {
                params: { from, to },
            });

            if (!data?.expenses || data.expenses.length === 0) {
                alert("هیچ هزینه‌ای در این بازه یافت نشد");
                return;
            }

            const doc = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });

            // Set RTL for the document
            doc.setR2L(false);

            // Add Font
            doc.addFileToVFS("Vazirmatn.ttf", VazirmatnTTF);
            doc.addFont("Vazirmatn.ttf", "Vazirmatn", "normal");
            doc.setFont("Vazirmatn");

            const formattedFrom = moment(from).format("YYYY/MM/DD");
            const formattedTo = moment(to).format("YYYY/MM/DD");
            const today = moment().format("YYYY/MM/DD");

            // Title
            doc.setFontSize(14);
            doc.text(
                `گزارش هزینه‌ها از ${formattedFrom} تا ${formattedTo}`,
                doc.internal.pageSize.getWidth() - 40,
                120,
                { align: "right" }
            );

            // Table Headers
            const headers = [["مبلغ", "بابت", "توسط", "تاریخ", "شماره"]];

            // Table Body
            const body = data.expenses.map((expense) => [
                Number(expense.amount).toLocaleString(),
                expense.purpose || "—",
                expense.by || "نامشخص",
                moment(expense.createdAt).format("YYYY/MM/DD"),
                expense.id.toString(),
            ]);

            autoTable(doc, {
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
                didDrawCell: (data) => {
                    if (data.cell) data.cell.styles.font = "Vazirmatn";
                },
            });

            const y = doc.lastAutoTable.finalY + 30;
            const pageWidth = doc.internal.pageSize.getWidth();

            // Summary
            const totalAmount = data.expenses.reduce(
                (sum, exp) => sum + Number(exp.amount),
                0
            );

            doc.setFontSize(11);
            doc.text(`تعداد هزینه‌ها: ${data.expenses.length}`, pageWidth - 40, y, { align: "right" });
            doc.text(`مجموع کل: ${totalAmount.toLocaleString()}`, pageWidth - 40, y + 20, { align: "right" });
            doc.text(`تاریخ صدور: ${today}`, pageWidth - 40, y + 40, { align: "right" });

            const pageCount = doc.internal.getNumberOfPages();
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
            doc.save(`Expenses_${formattedFrom}_to_${formattedTo}_${today}.pdf`);
        } catch (err) {
            console.error(err);
            alert("خطا در دریافت اطلاعات هزینه‌ها");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col sm:flex-row items-center gap-4 p-4">
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="border p-2 rounded w-full sm:w-auto"
                />
                <span className="text-gray-500">تا</span>
                <input
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="border p-2 rounded w-full sm:w-auto"
                />
            </div>

            <button
                onClick={handleDownload}
                disabled={loading}
                className="bg-cyan-800 text-white px-6 py-2 rounded hover:bg-cyan-700 disabled:bg-gray-400 w-full sm:w-auto"
            >
                {loading ? "در حال ساخت PDF..." : "دانلود گزارش هزینه‌ها"}
            </button>
        </div>
    );
};

export default ExpenseDateDownload;
