// SelectedOrderItemsDownload.jsx
import React, { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import moment from "moment-jalaali";
import { useSelector } from "react-redux";
import VazirmatnTTF from "../../../../public/ttf/Vazirmatn.js";

/* ============================================================
   Pure PDF generator — can be called from anywhere
============================================================ */
export const generateOrderItemsPdf = (items, currentUser) => {
  if (!items || items.length === 0) {
    alert("هیچ سفارشی انتخاب نشده");
    return;
  }

  const PAGE_WIDTH_CM = 8;
  const PAGE_WIDTH_PT = PAGE_WIDTH_CM * 28.3465;
  const PAGE_HEIGHT_PT = 800;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: [PAGE_WIDTH_PT, PAGE_HEIGHT_PT],
  });

  doc.setR2L(false);

  doc.addFileToVFS("Vazirmatn.ttf", VazirmatnTTF);
  doc.addFont("Vazirmatn.ttf", "Vazirmatn", "normal");
  doc.setFont("Vazirmatn");

  const MARGIN = 6;
  const CONTENT_WIDTH = PAGE_WIDTH_PT - MARGIN * 2;

  /* Header */
  const TOP_Y = 30;
  doc.setFontSize(8);
  doc.setTextColor(20);

  const todayDate = moment().format("YYYY/MM/DD");
  const userName =
    currentUser?.username ||
    currentUser?.fullname ||
    currentUser?.name ||
    "—";

  doc.text(`تاریخ: ${todayDate}`, MARGIN, TOP_Y, { align: "left" });
  doc.text(`کاربر: ${userName}`, PAGE_WIDTH_PT - MARGIN, TOP_Y, {
    align: "right",
  });

  let cursorY = TOP_Y + 14;

  /* Table */
  const headers = [["تعداد", "سایز", "نام فایل", "شماره"]];
  const body = items.map((item) => {
    const id = item.id ?? "—";
    const customer = item.customerName || "—";
    return [item.qnty, item.size, item.fileName || "—", `${id}\n${customer}`];
  });

  autoTable(doc, {
    startY: cursorY,
    margin: { left: MARGIN, right: MARGIN },
    head: headers,
    body: body,
    tableWidth: CONTENT_WIDTH,
    theme: "grid",
    styles: {
      font: "Vazirmatn",
      fontSize: 8,
      cellPadding: 3,
      halign: "center",
      valign: "middle",
      overflow: "linebreak",
      lineHeight: 1.15,
    },
    headStyles: {
      font: "Vazirmatn",
      fontStyle: "normal",
      fillColor: [220, 220, 220],
      textColor: 20,
      halign: "center",
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 55 },
      2: { cellWidth: "auto" },
      3: { cellWidth: 40 },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 3) {
        const [id, customer] = String(data.cell.raw).split("\n");
        data.cell.text = [];
        data.cell._idLine = id || "";
        data.cell._customerLine = customer || "";
      }
    },
    didDrawCell: (data) => {
      if (data.section === "body" && data.column.index === 3) {
        const id = data.cell._idLine || "";
        const customer = data.cell._customerLine || "";
        const centerX = data.cell.x + data.cell.width / 2;

        doc.setFont("Vazirmatn", "normal");
        doc.setFontSize(8);
        doc.setTextColor(20);
        doc.text(id, centerX, data.cell.y + 9, { align: "center" });

        doc.setFont("Vazirmatn", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(110);
        doc.text(customer, centerX, data.cell.y + 18, { align: "center" });
      }
    },
  });

  doc.save(`selected-orders-${moment().format("YYYY-MM-DD")}.pdf`);
};

/* ============================================================
   Button component (unchanged API)
============================================================ */
const SelectedOrderItemsDownload = ({ items }) => {
  const [loading, setLoading] = useState(false);
  const { currentUser } = useSelector((state) => state.user);

  const handleDownload = () => {
    setLoading(true);
    try {
      generateOrderItemsPdf(items, currentUser);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="w-full bg-cyan-800 text-white px-4 py-3 rounded transition hover:bg-cyan-700"
    >
      {loading ? "در حال ساخت PDF..." : "چاپ سفارشات انتخاب‌شده"}
    </button>
  );
};

export default SelectedOrderItemsDownload;