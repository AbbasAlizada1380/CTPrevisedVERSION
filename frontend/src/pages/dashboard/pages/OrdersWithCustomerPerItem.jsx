import { useEffect, useState } from "react";
import axios from "axios";
import {
  FaPlus,
  FaSpinner,
  FaTrash,
  FaUpload,
  FaFileExcel,
  FaPrint,
} from "react-icons/fa";
import * as XLSX from "xlsx";
import { useSelector } from "react-redux";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import moment from "moment-jalaali";
import OrderItemsList from "./OrderItemsList.jsx";
import sizes from "../services/Size.js";
// Reuse the same font file used by SelectedOrderItemsDownload
import VazirmatnTTF from "../../../../public/ttf/Vazirmatn.js";

const BASE_URL = import.meta.env.VITE_BASE_URL;

// Create empty order items
const createEmptyOrderItems = (count = 5) => {
  return Array.from({ length: count }, () => ({
    size: "",
    qnty: "",
    fileName: "",
    customer: "",
  }));
};

/* ============================================================
   PDF generator for the submitted bill — same style as
   SelectedOrderItemsDownload.generateOrderItemsPdf
   BUT opens the print dialog directly (no download)
============================================================ */
const printBillPdf = (billItems, currentUser) => {
  console.log(billItems);

  if (!billItems || billItems.length === 0) {
    alert("هیچ سفارشی برای چاپ وجود ندارد");
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

  const todayDate = moment().format("jYYYY/jMM/jDD");
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

  const body = billItems.map((item, idx) => {
    const id = item.id;
    const customer = item.customerName || "—";
    return [
      item.qnty ?? "—",
      item.size ?? "—",
      item.fileName || "—",
      `${id}\n${customer}`,
    ];
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

  /* ====== Open print dialog directly instead of downloading ====== */
  doc.autoPrint();
  const blobUrl = doc.output("bloburl");

  const printWindow = window.open(blobUrl, "_blank");
  if (!printWindow) {
    alert("لطفاً اجازه باز شدن پنجره پاپ‌آپ را بدهید تا فاکتور چاپ شود.");
  }
};

const OrdersWithCustomerPerItem = () => {
  const { currentUser } = useSelector((state) => state.user);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [orderItems, setOrderItems] = useState(createEmptyOrderItems(5));
  const [submitProgress, setSubmitProgress] = useState({ current: 0, total: 0 });

  // Bulk import states
  const [showBulkInput, setShowBulkInput] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);

  // Last submitted bill (for re-printing)
  const [lastBillItems, setLastBillItems] = useState(null);

  // Fetch customers
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${BASE_URL}/customers/active`);
        setCustomers(res.data.customers || []);
      } catch (err) {
        console.error("Error fetching customers:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  // Handle field changes
  const handleItemChange = (index, name, value) => {
    setOrderItems((prev) => {
      const updated = [...prev];
      updated[index][name] = value;
      return updated;
    });
  };

  // Add / delete items
  const addOrderItem = () => {
    setOrderItems((prev) => [
      ...prev,
      { size: "", qnty: "", fileName: "", customer: "" },
    ]);
  };

  const deleteOrderItem = (index) => {
    setOrderItems((prev) => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
  };

  // ----- Bulk Import from Textarea -----
  const handleBulkImport = () => {
    if (!bulkText.trim()) return;
    const lines = bulkText.split("\n").filter((line) => line.trim() !== "");
    const parsedItems = lines
      .map((line) => {
        let parts = line.split("\t").map((s) => s.trim());
        if (parts.length < 4) parts = line.split(/\s{2,}/).map((s) => s.trim());
        if (parts.length < 4) {
          console.warn("Skipping line – not enough columns:", line);
          return null;
        }
        const [size, fileName, qnty, customerName] = parts;
        const foundCustomer = customers.find(
          (c) => c.fullname.trim().toLowerCase() === customerName.toLowerCase()
        );
        if (!foundCustomer) {
          alert(`مشتری "${customerName}" یافت نشد. لطفاً ابتدا مشتری را اضافه کنید.`);
          return null;
        }
        return {
          size,
          fileName,
          qnty,
          customer: foundCustomer.id,
        };
      })
      .filter((item) => item !== null);

    if (parsedItems.length === 0) {
      alert("هیچ مورد معتبری برای وارد کردن یافت نشد.");
      return;
    }
    setOrderItems(parsedItems);
    setBulkText("");
    setShowBulkInput(false);
    alert(`${parsedItems.length} مورد با موفقیت وارد شد.`);
  };

  // ----- Excel Import -----
  const handleExcelUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadingFile(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { defval: "" });

        if (jsonData.length === 0) {
          alert("فایل اکسل خالی است.");
          setUploadingFile(false);
          return;
        }

        const headers = Object.keys(jsonData[0]);

        const findColumn = (possibleNames) => {
          for (const name of possibleNames) {
            const idx = headers.findIndex(
              (h) => h.trim().toLowerCase() === name.toLowerCase()
            );
            if (idx !== -1) return idx;
          }
          return -1;
        };

        const sizeCol = findColumn(["سایز", "size"]);
        const fileCol = findColumn(["نام فایل", "fileName", "file name"]);
        const qntyCol = findColumn(["تعداد", "quantity", "qnty"]);
        const customerCol = findColumn(["مشتری", "customer", "customerName"]);

        if ([sizeCol, fileCol, qntyCol, customerCol].includes(-1)) {
          alert(
            "ستون‌های مورد نیاز یافت نشدند. لطفاً از ستون‌های زیر استفاده کنید:\n" +
            "سایز, نام فایل, تعداد, مشتری"
          );
          setUploadingFile(false);
          return;
        }

        const parsedItems = [];
        for (const row of jsonData) {
          const size = row[headers[sizeCol]]?.toString().trim() || "";
          const fileName = row[headers[fileCol]]?.toString().trim() || "";
          const qnty = row[headers[qntyCol]]?.toString().trim() || "";
          const customerName = row[headers[customerCol]]?.toString().trim() || "";

          if (!size && !fileName && !qnty) continue;
          if (!customerName) {
            alert(`مشتری در ردیف "${size} ${fileName}" مشخص نشده است.`);
            continue;
          }

          const foundCustomer = customers.find(
            (c) => c.fullname.trim().toLowerCase() === customerName.toLowerCase()
          );
          if (!foundCustomer) {
            alert(`مشتری "${customerName}" یافت نشد. لطفاً ابتدا مشتری را اضافه کنید.`);
            continue;
          }

          parsedItems.push({
            size,
            fileName,
            qnty,
            customer: foundCustomer.id,
          });
        }

        if (parsedItems.length === 0) {
          alert("هیچ داده معتبری برای وارد کردن یافت نشد.");
          setUploadingFile(false);
          return;
        }

        setOrderItems(parsedItems);
        alert(`${parsedItems.length} مورد با موفقیت از فایل اکسل وارد شد.`);
      } catch (err) {
        console.error("Error parsing Excel file:", err);
        alert("خطا در خواندن فایل اکسل. لطفاً فرمت فایل را بررسی کنید.");
      } finally {
        setUploadingFile(false);
        event.target.value = "";
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // ----- Submit Orders -----
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!currentUser || !currentUser.id) {
      alert("لطفا دوباره وارد شوید");
      return;
    }

    const nonEmptyItems = orderItems.filter(
      (item) =>
        (item.size.trim() !== "" ||
          item.qnty !== "" ||
          item.fileName.trim() !== "") &&
        item.customer !== ""
    );

    if (nonEmptyItems.length === 0) {
      alert("لطفاً حداقل یک مورد سفارش را پر کرده و مشتری را انتخاب کنید.");
      return;
    }

    const missingCustomer = nonEmptyItems.some((item) => !item.customer);
    if (missingCustomer) {
      alert("برای هر مورد سفارش، یک مشتری انتخاب کنید.");
      return;
    }

    setSubmitting(true);
    setSubmitProgress({ current: 0, total: nonEmptyItems.length });

    let successCount = 0;
    let errorCount = 0;

    // Collect submitted items to build the bill
    const billItems = [];

    for (let i = 0; i < nonEmptyItems.length; i++) {
      const item = nonEmptyItems[i];

      const customerObj = customers.find(
        (c) => String(c.id) === String(item.customer)
      );

      const payload = {
        customer: item.customer,
        userId: currentUser.id,
        orderItems: [
          {
            size: item.size,
            qnty: Number(item.qnty) || 0,
            fileName: item.fileName,
          },
        ],
      };

      try {
        const res = await axios.post(`${BASE_URL}/orderItems`, payload);
        const data = res.data;

        // Extract the newly created order item (has the real DB id)
        const createdItem =
          data?.orderItems?.[0] ||
          data?.order?.orderItems?.[0] ||
          data?.orderItem ||
          data?.createdOrder ||
          null;

        // Customer info comes back on the response too (fallback to local lookup)
        const customerName =
          data?.customer?.fullname || customerObj?.fullname || "—";
        const customerPhone =
          data?.customer?.phoneNumber || customerObj?.phoneNumber || "";

        billItems.push({
          id: createdItem?.id ?? null,
          invoiceNumber:
            createdItem?.invoiceNumber ??
            data?.order?.invoiceNumber ??
            null,
          customerName,
          customerPhone,
          size: createdItem?.size ?? item.size,
          fileName: createdItem?.fileName ?? item.fileName,
          qnty: createdItem?.qnty ?? (Number(item.qnty) || 0),
          price: createdItem?.price ?? null,
          money: createdItem?.money ?? null,
          total: createdItem?.money ?? createdItem?.price * (Number(item.qnty) || 0) ?? null,
        });

        successCount++;
      } catch (err) {
        console.error(`Error submitting item ${i + 1}:`, err);
        errorCount++;
      }

      setSubmitProgress((prev) => ({ ...prev, current: i + 1 }));
    }

    setSubmitting(false);

    if (errorCount === 0) {
      alert(`✅ همه ${successCount} سفارش با موفقیت ثبت شدند.`);

      // Store bill items so the user can re-print later if they wish
      setLastBillItems(billItems);

      // Open print page directly (no download)
      printBillPdf(billItems, currentUser);

      setOrderItems(createEmptyOrderItems(5));
      setRefreshTrigger((prev) => prev + 1);
    } else {
      alert(`⚠️ ${successCount} سفارش ثبت شد، ${errorCount} مورد با خطا مواجه شد.`);
      if (billItems.length > 0) {
        setLastBillItems(billItems);
        printBillPdf(billItems, currentUser);
      }
    }

    setSubmitProgress({ current: 0, total: 0 });
  };

  const filledCount = orderItems.filter(
    (item) => item.size || item.qnty || item.fileName
  ).length;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto bg-white rounded-xl shadow p-6 space-y-6">
        <h2 className="text-xl font-bold text-cyan-800 mb-6">
          ثبت سفارش با انتخاب مشتری برای هر کالا
        </h2>

        {/* ----- Bulk Import Section ----- */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <button
            type="button"
            onClick={() => setShowBulkInput(!showBulkInput)}
            className="flex items-center gap-2 text-cyan-800 hover:text-cyan-600 font-medium"
          >
            <FaUpload />
            {showBulkInput ? "بستن ورود سریع" : "ورود سریع (از متن یا اکسل)"}
          </button>

          {showBulkInput && (
            <div className="mt-3 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  چسباندن متن (با تب یا دو فاصله)
                </label>
                <textarea
                  rows="6"
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder={`سایز\tنام فایل\tتعداد\tمشتری
645 × 510 mm\t-\t1\tپرچون
510 × 400 mm\tبیسکویت گل سیب\t4\tاکبر`}
                  className="w-full border rounded-md px-3 py-2 font-mono text-sm"
                  dir="ltr"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={handleBulkImport}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
                  >
                    بارگذاری متن
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkText("")}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition"
                  >
                    پاک کردن
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-300 my-2"></div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  بارگذاری فایل اکسل (.xlsx, .xls)
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-blue-700 transition">
                    <FaFileExcel />
                    انتخاب فایل
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleExcelUpload}
                      className="hidden"
                      disabled={uploadingFile}
                    />
                  </label>
                  {uploadingFile && (
                    <FaSpinner className="animate-spin text-blue-600 text-xl" />
                  )}
                  <span className="text-sm text-gray-500">
                    ستون‌ها باید شامل عناوین: سایز، نام فایل، تعداد، مشتری
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Order Items */}
        <div className="space-y-4">
          {orderItems.map((item, index) => (
            <div
              key={index}
              className="p-4 border rounded-md relative bg-white border-gray-300"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium">مشتری</label>
                  <select
                    value={item.customer}
                    onChange={(e) =>
                      handleItemChange(index, "customer", e.target.value)
                    }
                    className="w-full border rounded-md px-3 py-2"
                    required
                  >
                    <option value="">انتخاب مشتری</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.fullname} ({c.phoneNumber})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium">نام فایل</label>
                  <input
                    type="text"
                    value={item.fileName}
                    onChange={(e) =>
                      handleItemChange(index, "fileName", e.target.value)
                    }
                    className="w-full border rounded-md px-3 py-2"
                    placeholder="example.pdf"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium">سایز</label>
                  <select
                    value={item.size}
                    onChange={(e) => handleItemChange(index, "size", e.target.value)}
                    className="w-full border rounded-md px-3 py-2"
                  >
                    <option value="">انتخاب سایز</option>
                    {sizes.map((s) => (
                      <option key={s.id || s} value={s.label || s}>
                        {s.label || s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium">تعداد</label>
                  <input
                    type="number"
                    min="1"
                    value={item.qnty}
                    onChange={(e) => handleItemChange(index, "qnty", e.target.value)}
                    className="w-full border rounded-md px-3 py-2"
                    placeholder="0"
                  />
                </div>
              </div>

              {orderItems.length > 5 && (
                <button
                  type="button"
                  onClick={() => deleteOrderItem(index)}
                  className="absolute top-6 right-2 text-red-500 hover:text-red-700"
                  title="حذف این مورد"
                >
                  <FaTrash />
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addOrderItem}
            className="flex items-center gap-2 bg-cyan-800 text-white px-4 py-2 rounded-lg font-semibold hover:bg-cyan-900 transition"
          >
            <FaPlus /> افزودن مورد جدید (مجموع: {orderItems.length})
          </button>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className={`w-full py-3 rounded-md transition ${submitting
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-cyan-800 text-white hover:bg-cyan-900"
            }`}
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <FaSpinner className="animate-spin" />
              در حال ثبت سفارشات... ({submitProgress.current}/{submitProgress.total})
            </span>
          ) : (
            `ثبت سفارشات (${filledCount} مورد پر شده)`
          )}
        </button>

        {/* Re-print last bill */}
        {lastBillItems && lastBillItems.length > 0 && (
          <button
            type="button"
            onClick={() => printBillPdf(lastBillItems, currentUser)}
            className="w-full flex items-center justify-center gap-2 bg-cyan-100 text-cyan-900 py-2 rounded-md hover:bg-cyan-200 transition"
          >
            <FaPrint /> چاپ مجدد آخرین فاکتور ({lastBillItems.length} قلم)
          </button>
        )}
      </div>

      <div className="mt-4">
        <OrderItemsList refreshTrigger={refreshTrigger} />
      </div>
    </div>
  );
};

export default OrdersWithCustomerPerItem;