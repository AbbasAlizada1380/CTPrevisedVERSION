import React, { useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import moment from "moment-jalaali";

import VazirmatnTTF from "../../../../../public/ttf/Vazirmatn.js";

moment.locale("en");

const BASE_URL = import.meta.env.VITE_BASE_URL;

const LoanPaymentDownload = () => {
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

      // Fetch payments filtered by date range
      const response = await axios.get(`${BASE_URL}/payments`, {
        params: { from, to },
      });

      const payments = response.data?.data?.payments;
      const summary = response.data?.data?.summary;

      if (!payments || payments.length === 0) {
        alert("هیچ پرداخت قرضه‌ای در این بازه یافت نشد");
        return;
      }

      // -------- PDF generation --------
      const doc = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
      doc.setR2L(false);

      // Load Vazirmatn font
      doc.addFileToVFS("Vazirmatn.ttf", VazirmatnTTF);
      doc.addFont("Vazirmatn.ttf", "Vazirmatn", "normal");
      doc.setFont("Vazirmatn", "normal");

      const formattedFrom = moment(from).format("YYYY/MM/DD");
      const formattedTo = moment(to).format("YYYY/MM/DD");
      const today = moment().format("YYYY/MM/DD");

      const pageWidth = doc.internal.pageSize.getWidth();
      const rightX = pageWidth - 40;

      // Title
      doc.setFontSize(14);
      doc.text(
        `گزارش پرداخت‌های قرضه از ${formattedFrom} تا ${formattedTo}`,
        rightX,
        120,
        { align: "right" }
      );

      // Table headers
      const headers = [
        ["مبلغ (افغانی)", "کارمند", "تاریخ پرداخت", "شماره قرضه", "وضعیت قرضه"]
      ];

      // Build table body
      const body = payments.map((payment) => {
        const loan = payment.Loan || {};
        const employee = loan.Employee || {};
        return [
          Number(payment.amount).toLocaleString(),
          employee.fullName || "نامشخص",
          moment(payment.paymentDate).format("YYYY/MM/DD"),
          loan.id ? loan.id.toString() : "—",
          loan.status || "—",
        ];
      });

      // AutoTable
      autoTable(doc, {
        margin: { top: 142, bottom: 60 },
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
      const totalAmount = summary?.totalAmount || 0;
      const totalCount = summary?.totalPayments || payments.length;

      // Summary section
      doc.setFontSize(11);
      doc.text(
        `تعداد پرداخت‌ها: ${totalCount}`,
        rightX,
        y,
        { align: "right" }
      );
      doc.text(
        `مجموع کل: ${Number(totalAmount).toLocaleString()} افغانی`,
        rightX,
        y + 20,
        { align: "right" }
      );
      doc.text(
        `تاریخ صدور: ${today}`,
        rightX,
        y + 40,
        { align: "right" }
      );

      // Page numbers
      const pageCount = doc.internal.getNumberOfPages();
      const pageHeight = doc.internal.pageSize.getHeight();

      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text(
          `${i}/${pageCount}`,
          rightX,
          pageHeight - 40,
          { align: "right" }
        );
      }

      doc.save(`Loan_Payments_${formattedFrom}_to_${formattedTo}.pdf`);
    } catch (err) {
      console.error(err);
      alert("خطا در دریافت اطلاعات پرداخت‌ها");
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
        {loading ? "در حال ساخت PDF..." : "دانلود گزارش پرداخت‌های قرضه"}
      </button>
    </div>
  );
};

export default LoanPaymentDownload;