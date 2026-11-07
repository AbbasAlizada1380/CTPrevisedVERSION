import React, { useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import moment from "moment-jalaali";

import VazirmatnTTF from "../../../../../public/ttf/Vazirmatn.js";

moment.locale("en");

const BASE_URL = import.meta.env.VITE_BASE_URL;

const SalaryDateDownload = () => {
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

            const { data } = await axios.get(
                `${BASE_URL}/attendance/date-range`,
                {
                    params: { from, to },
                }
            );

            if (!data?.data || data.data.length === 0) {
                alert("هیچ رکورد حضوری در این بازه یافت نشد");
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

            const formattedFrom = moment(from).format("YYYY/MM/DD");
            const formattedTo = moment(to).format("YYYY/MM/DD");
            const today = moment().format("YYYY/MM/DD");

            doc.setFontSize(14);
            doc.text(
                `گزارش حاضری کارمندان از ${formattedFrom} تا ${formattedTo}`,
                doc.internal.pageSize.getWidth() - 40,
                120,
                { align: "right" }
            );

            // ===== Table Headers =====
            const headers = [
                ["تاریخ پرداخت",
                    "مبلغ پرداخت‌شده",   // Paid
                    "مبلغ قابل پرداخت",  // To Pay
                    "کارمند",            // Name
                ],
            ];

            // ===== Table Body =====
            const body = data.data.map((record) => [
                moment(record.createdAt).format("YYYY/MM/DD"),
                Number(record.receipt || 0).toLocaleString(), // Paid
                Number(record.total || 0).toLocaleString(),   // To Pay
                record.Staff?.name || "نامشخص",               // Name
            ]);

            autoTable(doc, {
                margin: {
                    top: 140,
                    bottom: 28.35 // ✅ دقیقاً 1cm فاصله از پایین
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
            });

            const y = doc.lastAutoTable.finalY + 30;
            const pageWidth = doc.internal.pageSize.getWidth();

            // ===== Calculate Summary =====
            const totalSalary = data.data.reduce(
                (sum, r) => sum + Number(r.salary || 0),
                0
            );

            const totalOvertime = data.data.reduce(
                (sum, r) => sum + Number(r.overtime || 0),
                0
            );

            const grandTotal = data.data.reduce(
                (sum, r) => sum + Number(r.total || 0),
                0
            );

            doc.setFontSize(11);

            doc.text(
                `تعداد رکوردها: ${data.count || 0}`,
                pageWidth - 40,
                y,
                { align: "right" }
            );

            doc.text(
                `مجموع معاش: ${totalSalary.toLocaleString()}`,
                pageWidth - 40,
                y + 20,
                { align: "right" }
            );

            doc.text(
                `مجموع اضافه‌کاری: ${totalOvertime.toLocaleString()}`,
                pageWidth - 40,
                y + 40,
                { align: "right" }
            );

            doc.text(
                `مجموع کل پرداختی: ${grandTotal.toLocaleString()}`,
                pageWidth - 40,
                y + 60,
                { align: "right" }
            );

            doc.text(
                `تاریخ صدور: ${today}`,
                pageWidth - 40,
                y + 80,
                { align: "right" }
            );
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
            doc.save(
                `Attendance_${formattedFrom}_to_${formattedTo}_${today}.pdf`
            );

        } catch (err) {
            console.error(err);
            alert("خطا در دریافت اطلاعات حاضری");
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
                {loading ? "در حال ساخت PDF..." : "دانلود گزارش رسیدها"}
            </button>
        </div>
    );
};

export default SalaryDateDownload;