import React from "react";
import { FaTrash, FaMoneyBillWave } from "react-icons/fa";
import sizes from "../services/Size.js";

const OrderItemForm = ({
  item,
  index,
  handleItemChange,
  deleteOrderItem,
  canDelete,
  selectedCustomer, // 👈 pass the currently selected customer (optional)
}) => {
  // Check if item is completely empty
  const isEmpty = !item.size && !item.qnty && !item.fileName;

  // 🔹 Resolve the price from the customer's priceList for the chosen size
  const resolvePrice = () => {
    if (!selectedCustomer || !item.size) return null;
    if (!Array.isArray(selectedCustomer.priceList)) return null;

    const normalized = item.size.trim().replace(/\s+/g, " ");
    const entry = selectedCustomer.priceList.find(
      (p) => (p.size || "").trim().replace(/\s+/g, " ") === normalized
    );
    return entry ? Number(entry.price) || 0 : null;
  };

  const priceFromList = resolvePrice();
  const totalMoney =
    priceFromList !== null && item.qnty
      ? priceFromList * Number(item.qnty)
      : null;

  return (
    <div
      className={`p-4 border rounded-md relative ${
        isEmpty
          ? "bg-gray-50 border-dashed border-gray-300"
          : "bg-white border-gray-300"
      }`}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* File Name */}
        <div>
          <label className="block mb-1 text-sm font-medium">نام فایل</label>
          <input
            type="text"
            value={item.fileName}
            onChange={(e) =>
              handleItemChange(index, "fileName", e.target.value)
            }
            className={`w-full border rounded-md px-3 py-2 ${
              isEmpty ? "border-dashed" : ""
            }`}
            placeholder="example.pdf"
          />
        </div>

        {/* Size */}
        <div>
          <label className="block mb-1 text-sm font-medium">سایز</label>
          <select
            value={item.size}
            onChange={(e) => handleItemChange(index, "size", e.target.value)}
            className={`w-full border rounded-md px-3 py-2 ${
              isEmpty ? "border-dashed" : ""
            }`}
          >
            <option value="">انتخاب سایز</option>
            {sizes.map((s) => (
              <option key={s.id || s} value={s.label || s}>
                {s.label || s}
              </option>
            ))}
          </select>
        </div>

        {/* Quantity */}
        <div>
          <label className="block mb-1 text-sm font-medium">تعداد</label>
          <input
            type="number"
            min="1"
            value={item.qnty}
            onChange={(e) => handleItemChange(index, "qnty", e.target.value)}
            className={`w-full border rounded-md px-3 py-2 ${
              isEmpty ? "border-dashed" : ""
            }`}
            placeholder="0"
          />
        </div>

        {/* Price (read-only, resolved from customer's price list) */}
        {/* <div>
          <label className="block mb-1 text-sm font-medium flex items-center gap-1">
            <FaMoneyBillWave className="text-green-700" />
            قیمت (از لیست مشتری)
          </label>
          <input
            type="text"
            value={
              priceFromList === null
                ? item.size
                  ? "قیمت تعیین نشده"
                  : "—"
                : priceFromList.toLocaleString("en-US")
            }
            readOnly
            className={`w-full border rounded-md px-3 py-2 bg-gray-50 text-center font-semibold ${
              priceFromList === null && item.size
                ? "text-red-600"
                : "text-green-700"
            } ${isEmpty ? "border-dashed" : ""}`}
            placeholder="—"
          />
        </div> */}
      </div>

      {/* Total Preview (only shown if price is available and qty entered) */}
      {totalMoney !== null && (
        <div className="mt-3 flex items-center justify-end gap-2 text-sm">
          <span className="text-gray-600">مجموع:</span>
          <span className="font-bold text-purple-700">
            {totalMoney.toLocaleString("en-US")} افغانی
          </span>
        </div>
      )}

      {/* Delete Button */}
      {canDelete && (
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
  );
};

export default OrderItemForm;