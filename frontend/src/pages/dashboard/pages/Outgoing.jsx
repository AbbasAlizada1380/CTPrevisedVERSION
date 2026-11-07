import { useState, useEffect } from "react";
import axios from "axios";
import sizes from "../services/Size.js";
import Pagination from "../pagination/Pagination"; // Import the Pagination component
import DateOutgoingDownload from "./report/DateOutgoingDownload.jsx";

const BASE_URL = import.meta.env.VITE_BASE_URL;
const OUTGOING_API_URL = `${BASE_URL}/stock/outgoing`;

// Function to create empty items
const createEmptyItems = (count = 5) => {
  return Array.from({ length: count }, () => ({
    size: "",
    quantity: ""
  }));
};

const Outgoing = () => {
  const [items, setItems] = useState(createEmptyItems(5)); // Start with 5 empty items
  const [outgoings, setOutgoings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [summary, setSummary] = useState({
    totalQuantity: 0,
    totalMoney: 0,
    averageSaleValue: 0
  });
  const [stockInfo, setStockInfo] = useState({});
  const [perPage, setPerPage] = useState(10);

  // Fetch all outgoings
  const fetchOutgoings = async (page = 1) => {
    try {
      setLoading(true);
      const response = await axios.get(`${OUTGOING_API_URL}?page=${page}&limit=${perPage}`);
      setOutgoings(response.data.outgoings);
      setTotalPages(response.data.pagination.totalPages);
      setTotalItems(response.data.pagination.totalItems);
      setSummary(response.data.summary || {});
      setStockInfo(response.data.stockLevels || {});
      setCurrentPage(page);
    } catch (error) {
      console.error("Error fetching outgoings:", error);
      alert("خطا در دریافت اطلاعات خروجی‌ها");
    } finally {
      setLoading(false);
    }
  };

  // Handle page change
  const handlePageChange = (page) => {
    fetchOutgoings(page);
  };

  // Fetch single outgoing for edit
  const fetchOutgoingById = async (id) => {
    try {
      setLoading(true);
      const response = await axios.get(`${OUTGOING_API_URL}/${id}`);
      const outgoing = response.data;

      // Set form for editing - replace all items with the editing item
      setItems([{
        size: outgoing.size || "",
        quantity: outgoing.quantity || ""
      }]);
      setEditingId(id);
      setHasUnsavedChanges(false);

      // Scroll to form
      document.getElementById('outgoing-form').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      console.error("Error fetching outgoing:", error);
      alert("خطا در دریافت اطلاعات خروجی");
    } finally {
      setLoading(false);
    }
  };

  // Create new outgoing
  const createOutgoing = async (outgoingData) => {
    try {
      const response = await axios.post(OUTGOING_API_URL, outgoingData);
      return response.data;
    } catch (error) {
      console.error("Error creating outgoing:", error.response?.data || error.message);
      alert(error.response?.data?.message || "خطا در ثبت خروجی");
      throw error;
    }
  };

  // Update outgoing
  const updateOutgoing = async (id, outgoingData) => {
    try {
      const response = await axios.put(`${OUTGOING_API_URL}/${id}`, outgoingData);
      return response.data;
    } catch (error) {
      console.error("Error updating outgoing:", error.response?.data || error.message);
      alert(error.response?.data?.message || "خطا در بروزرسانی خروجی");
      throw error;
    }
  };

  // Delete outgoing
  const deleteOutgoing = async (id) => {
    if (!window.confirm("آیا از حذف این خروجی اطمینان دارید؟")) {
      return;
    }

    try {
      await axios.delete(`${OUTGOING_API_URL}/${id}`);
      alert("خروجی با موفقیت حذف شد");
      fetchOutgoings(currentPage);
    } catch (error) {
      console.error("Error deleting outgoing:", error);
      alert("خطا در حذف خروجی");
    }
  };

  // Check stock availability for a size
  const checkStockAvailability = async (size) => {
    try {
      return stockInfo[size] || "0";
    } catch (error) {
      console.error("Error checking stock:", error);
      return "0";
    }
  };

  // Update a single item
  const handleChange = async (index, e) => {
    const { name, value } = e.target;
    const updatedItems = [...items];

    // Update the field
    updatedItems[index][name] = value;

    // If size changed, check stock availability
    if (name === "size" && value) {
      const availableStock = await checkStockAvailability(value);
      console.log(`Available stock for ${value}: ${availableStock}`);
    }

    setItems(updatedItems);
    setHasUnsavedChanges(true);
  };

  // Add new empty row
  const addItem = () => {
    setItems([...items, { size: "", quantity: "" }]);
    setHasUnsavedChanges(true);
  };

  // Remove row from form - don't allow removal if we have only 5 items (initial state)
  const removeItem = (index) => {
    if (items.length <= 5) {
      alert("حداقل باید ۵ مورد موجود باشد");
      return;
    }

    const updatedItems = items.filter((_, i) => i !== index);
    setItems(updatedItems);
    setHasUnsavedChanges(true);
  };

  // Reset form to initial 5 empty items
  const resetForm = () => {
    if (hasUnsavedChanges && !window.confirm("آیا از لغو تغییرات اطمینان دارید؟ تغییرات ذخیره نشده از بین خواهند رفت.")) {
      return;
    }

    setItems(createEmptyItems(5));
    setEditingId(null);
    setHasUnsavedChanges(false);
  };

  // Handle form submission with smart filtering
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Filter out completely empty items
    const nonEmptyItems = items.filter(item =>
      item.size.trim() !== "" ||
      item.quantity !== ""
    );

    // If no valid items, show error
    if (nonEmptyItems.length === 0) {
      alert("لطفا حداقل یک مورد را پر کنید");
      return;
    }

    // Validate filled items
    const validationErrors = [];
    nonEmptyItems.forEach((item, index) => {
      if (!item.size) validationErrors.push(`سطر ${index + 1}: اندازه را انتخاب کنید`);
      if (!item.quantity || parseFloat(item.quantity) <= 0) validationErrors.push(`سطر ${index + 1}: تعداد معتبر وارد کنید`);
    });

    if (validationErrors.length > 0) {
      alert(validationErrors.join("\n"));
      return;
    }

    setLoading(true);

    try {
      // If editing, update existing outgoing
      if (editingId) {
        await updateOutgoing(editingId, nonEmptyItems[0]);
        alert("خروجی با موفقیت بروزرسانی شد");
      }
      // If creating, create each non-empty item as separate outgoing
      else {
        let successCount = 0;
        for (const item of nonEmptyItems) {
          await createOutgoing({
            size: item.size,
            quantity: item.quantity
          });
          successCount++;
        }
        alert(`${successCount} مورد با موفقیت ثبت شد`);
      }

      // Reset form but keep 5 empty items
      setItems(createEmptyItems(5));
      setEditingId(null);
      setHasUnsavedChanges(false);
      fetchOutgoings(currentPage);
    } catch (error) {
      console.error("Error:", error);
      // Error is already shown by createOutgoing/updateOutgoing functions
    } finally {
      setLoading(false);
    }
  };

  // Initialize - fetch outgoings on component mount
  useEffect(() => {
    fetchOutgoings();
  }, []);

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  // Count filled items
  const filledItemsCount = items.filter(item =>
    item.size.trim() !== "" ||
    item.quantity !== ""
  ).length;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-cyan-800 mb-6">مدیریت خروجی‌ها</h2>


      {/* Form Section */}
      <div id="outgoing-form" className="mb-8 bg-white p-6 rounded-xl shadow-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          {items.map((item, index) => {
            // Check if item is empty
            const isEmpty = !item.size && !item.quantity;

            return (
              <div
                key={index}
                className={`grid grid-cols-1 md:grid-cols-6 gap-4 items-end border-b border-gray-200 pb-4 mb-4 ${isEmpty ? 'bg-gray-50 p-4 rounded-md border-dashed' : ''}`}
              >
                {/* Size */}
                <div className="md:col-span-3">
                  <label className="block mb-1 text-sm font-medium">اندازه</label>
                  <select
                    name="size"
                    value={item.size}
                    onChange={(e) => handleChange(index, e)}
                    className={`w-full border rounded-md p-2 focus:ring-2 focus:ring-cyan-300 ${isEmpty ? 'border-dashed' : ''}`}
                  >
                    <option value="">انتخاب اندازه</option>
                    {sizes.map((s) => (
                      <option key={s.id} value={s.label}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  {item.size && stockInfo[item.size] && (
                    <p className="text-xs text-gray-500 mt-1">
                      موجودی فعلی: {parseFloat(stockInfo[item.size] || 0).toLocaleString('en-US')} عدد
                    </p>
                  )}
                </div>

                {/* Quantity */}
                <div>
                  <label className="block mb-1 text-sm font-medium">تعداد</label>
                  <input
                    type="number"
                    name="quantity"
                    value={item.quantity}
                    onChange={(e) => handleChange(index, e)}
                    className={`w-full border rounded-md p-2 focus:ring-2 focus:ring-cyan-300 ${isEmpty ? 'border-dashed' : ''}`}
                    placeholder="تعداد"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    pattern="[0-9]*"
                  />
                </div>

                {/* Remove Button (only show if multiple items and not editing) */}
                {items.length > 5 && !editingId && (
                  <div>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="w-full px-3 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition"
                      title="حذف این مورد"
                    >
                      حذف
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-200">
            {!editingId && (
              <>
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center gap-2 bg-cyan-600 text-white px-4 py-2 rounded-md hover:bg-cyan-700 transition"
                >
                  + مورد جدید (مجموع: {items.length})
                </button>

                <button
                  type="button"
                  onClick={() => setItems(createEmptyItems(5))}
                  className="flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition"
                  disabled={items.length === 5 && !hasUnsavedChanges}
                >
                  بازنشانی به ۵ مورد خالی
                </button>
              </>
            )}

            <button
              type="submit"
              disabled={loading || filledItemsCount === 0}
              className="flex-1 bg-cyan-800 text-white py-3 rounded-md hover:bg-cyan-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "در حال پردازش..." :
                editingId ? "بروزرسانی خروجی" :
                  `ثبت ${filledItemsCount} مورد خروجی`}
            </button>

            {(editingId || hasUnsavedChanges) && (
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-400 text-white px-4 py-3 rounded-md hover:bg-gray-500 transition"
              >
                {editingId ? "انصراف ویرایش" : "لغو تغییرات"}
              </button>
            )}
          </div>
        </form>
      </div>
<DateOutgoingDownload/>
      {/* Outgoings List */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-bold text-cyan-800">لیست خروجی‌ها ({totalItems} مورد)</h3>
          <span className="text-sm text-gray-600">
            صفحه {currentPage} از {totalPages}
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">در حال بارگذاری...</p>
          </div>
        ) : outgoings.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">هیچ خروجی ثبت نشده است</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-center">
                <thead className="bg-cyan-50 text-cyan-800">
                  <tr>
                    <th className="p-3 border-b font-semibold">#</th>
                    <th className="p-3 border-b font-semibold">اندازه</th>
                    <th className="p-3 border-b font-semibold">تعداد (پلیت)</th>
                    <th className="p-3 border-b font-semibold">قیمت واحد (میانگین)</th>
                    <th className="p-3 border-b font-semibold">مبلغ کل (افغانی)</th>
                    <th className="p-3 border-b font-semibold">تاریخ</th>
                  </tr>
                </thead>
                <tbody>
                  {outgoings.map((outgoing, index) => {
                    const unitPrice = parseFloat(outgoing.money) / parseFloat(outgoing.quantity);
                    const currentStock = stockInfo[outgoing.size] || 0;

                    return (
                      <tr
                        key={outgoing.id}
                        className="hover:bg-gray-50 border-b last:border-0 transition-colors"
                      >
                        <td className="p-3 text-gray-600">
                          {outgoing.id}
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col items-center gap-1">
                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
                              {outgoing.size}
                            </span>
                            {currentStock > 0 && (
                              <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                موجودی: {parseFloat(currentStock).toLocaleString('en-US')}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-semibold">
                            {parseFloat(outgoing.quantity || 0).toLocaleString('en-US')}
                          </span>
                        </td>
                        <td className="p-3 text-green-700 font-semibold">
                          {unitPrice.toFixed(3).toLocaleString('en-US')}
                        </td>
                        <td className="p-3 text-purple-700 font-bold">
                          {parseFloat(outgoing.money || 0).toLocaleString('en-US')}
                        </td>
                        <td className="p-3 text-gray-500 text-sm">
                          {outgoing.createdAt ?
                            new Date(outgoing.createdAt)
                              .toLocaleDateString('eng-en')
                              .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
                            : '—'
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-6 border-t border-gray-200">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Outgoing;