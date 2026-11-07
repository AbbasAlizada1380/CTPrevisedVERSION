import { useState, useEffect } from "react";
import axios from "axios";
import sizes from "../services/Size.js";
import Pagination from "../pagination/Pagination";
import Factors from "./Factors.jsx";
import DateIncomeDownload from "./report/DateIncomeDownload.jsx";

const BASE_URL = import.meta.env.VITE_BASE_URL;
const INCOME_API_URL = `${BASE_URL}/stock/income`;

// Helper: create a specified number of empty income items
const createEmptyItems = (count = 5) => {
  return Array.from({ length: count }, () => ({
    size: "",
    quantity: "",
    price: "",
    money: "",
    spent: "0"
  }));
};

const Incoming = () => {
  // Form state
  const [items, setItems] = useState(createEmptyItems(5));
  const [editingId, setEditingId] = useState(null);
  const [activeTab, setActiveTab] = useState("incomes");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Seller state
  const [sellers, setSellers] = useState([]);
  const [sellerMode, setSellerMode] = useState("existing"); // "existing" or "new"
  const [sellerId, setSellerId] = useState("");
  const [newSeller, setNewSeller] = useState("");

  // Payment field – upfront payment for the factor (only for batch creation)
  const [paidAmount, setPaidAmount] = useState("");

  // Incomes list (table)
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [perPage, setPerPage] = useState(10);

  // ---------- API calls ----------
  const fetchSellers = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/seller/active`);
      setSellers(response.data.data || []);
    } catch (error) {
      console.error("Error fetching sellers:", error);
    }
  };

  const fetchIncomes = async (page = 1) => {
    try {
      setLoading(true);
      const response = await axios.get(`${INCOME_API_URL}?page=${page}&limit=${perPage}`);
      setIncomes(response.data.incomes);
      setTotalPages(response.data.pagination.totalPages);
      setTotalItems(response.data.pagination.totalItems);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error fetching incomes:", error);
      alert("خطا در دریافت اطلاعات درآمدها");
    } finally {
      setLoading(false);
    }
  };

  // Fetch single income for editing (populates form with one item)
  const fetchIncomeById = async (id) => {
    try {
      setLoading(true);
      const response = await axios.get(`${INCOME_API_URL}/${id}`);
      const income = response.data;
      setItems([{
        size: income.size || "",
        quantity: income.quantity || "",
        price: income.price || "",
        money: income.money || "",
        spent: income.spent || "0"
      }]);
      setEditingId(id);
      setHasUnsavedChanges(false);
      setPaidAmount(""); // editing a single income does not affect factor's upfront payment

      // Restore seller info
      if (income.seller) {
        if (income.seller.id) {
          setSellerMode("existing");
          setSellerId(String(income.seller.id));
          setNewSeller("");
        } else if (income.seller.name) {
          setSellerMode("new");
          setNewSeller(income.seller.name);
          setSellerId("");
        }
      } else {
        setSellerMode("existing");
        setSellerId("");
        setNewSeller("");
      }

      document.getElementById("income-form").scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      console.error("Error fetching income:", error);
      alert("خطا در دریافت اطلاعات درآمد");
    } finally {
      setLoading(false);
    }
  };

  const deleteIncome = async (id) => {
    if (!window.confirm("آیا از حذف این درآمد اطمینان دارید؟")) return;
    try {
      await axios.delete(`${INCOME_API_URL}/${id}`);
      alert("درآمد با موفقیت حذف شد");
      fetchIncomes(currentPage);
    } catch (error) {
      console.error("Error deleting income:", error);
      alert("خطا در حذف درآمد");
    }
  };

  // Batch create (multiple incomes)
  const batchCreateIncomes = async (seller, incomesArray, paidAmountValue) => {
    const response = await axios.post(`${INCOME_API_URL}/batch`, {
      seller,
      incomes: incomesArray,
      paidAmount: paidAmountValue
    });
    return response.data;
  };

  // Update single income (assumes backend PUT endpoint exists)
  const updateIncome = async (id, incomeData) => {
    const response = await axios.put(`${INCOME_API_URL}/${id}`, incomeData);
    return response.data;
  };

  // ---------- Form helpers ----------
  const calculateMoney = (quantity, price) => {
    const qty = parseFloat(quantity) || 0;
    const prc = parseFloat(price) || 0;
    return (qty * prc).toFixed(2);
  };

  const handleChange = (index, e) => {
    const { name, value } = e.target;
    const updatedItems = [...items];
    updatedItems[index][name] = value;

    if (name === "quantity" || name === "price") {
      updatedItems[index].money = calculateMoney(updatedItems[index].quantity, updatedItems[index].price);
    }

    setItems(updatedItems);
    setHasUnsavedChanges(true);
  };

  const addItem = () => {
    setItems([...items, { size: "", quantity: "", price: "", money: "", spent: "0" }]);
    setHasUnsavedChanges(true);
  };

  const removeItem = (index) => {
    if (items.length <= 5) {
      alert("حداقل باید ۵ مورد وجود داشته باشد");
      return;
    }
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    setHasUnsavedChanges(true);
  };

  const resetForm = () => {
    setItems(createEmptyItems(5));
    setEditingId(null);
    setSellerMode("existing");
    setSellerId("");
    setNewSeller("");
    setPaidAmount("");
    setHasUnsavedChanges(false);
  };

  const handlePageChange = (page) => {
    fetchIncomes(page);
  };
  // ---------- Submit handler ----------
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Seller validation
    if (sellerMode === "existing" && !sellerId) {
      alert("لطفاً فروشنده را انتخاب کنید");
      return;
    }
    if (sellerMode === "new" && !newSeller.trim()) {
      alert("لطفاً نام فروشنده جدید را وارد کنید");
      return;
    }

    // Filter out completely empty rows
    const nonEmptyItems = items.filter(item =>
      item.size.trim() !== "" || item.quantity !== "" || item.price !== ""
    );
    if (nonEmptyItems.length === 0) {
      alert("حداقل یک مورد را پر کنید");
      return;
    }

    // Validate each filled row
    const errors = [];
    nonEmptyItems.forEach((item, idx) => {
      if (!item.size) errors.push(`سطر ${idx + 1}: اندازه را انتخاب کنید`);
      if (!item.quantity || parseFloat(item.quantity) <= 0) errors.push(`سطر ${idx + 1}: تعداد معتبر وارد کنید`);
      if (!item.price || parseFloat(item.price) <= 0) errors.push(`سطر ${idx + 1}: قیمت معتبر وارد کنید`);
    });
    if (errors.length) {
      alert(errors.join("\n"));
      return;
    }

    // Validate paidAmount (only for batch creation, not for editing)
    const paidAmountValue = paidAmount === "" ? 0 : parseFloat(paidAmount);
    if (!editingId && (isNaN(paidAmountValue) || paidAmountValue < 0)) {
      alert("مبلغ پرداختی باید عددی مثبت یا صفر باشد");
      return;
    }

    setSubmitting(true);
    try {
      const seller = sellerMode === "existing"
        ? { id: parseInt(sellerId) }
        : { name: newSeller.trim() };

      if (editingId) {
        // Single update – paidAmount is ignored (factors are not updated here)
        await updateIncome(editingId, {
          seller,
          size: nonEmptyItems[0].size,
          quantity: nonEmptyItems[0].quantity,
          price: nonEmptyItems[0].price,
          spent: nonEmptyItems[0].spent || "0"
        });
        alert("درآمد با موفقیت بروزرسانی شد");
      } else {
        // Batch create with upfront payment
        const incomesForBatch = nonEmptyItems.map(item => ({
          size: item.size,
          quantity: parseFloat(item.quantity),
          price: parseFloat(item.price),
          spent: parseFloat(item.spent) || 0
        }));
        await batchCreateIncomes(seller, incomesForBatch, paidAmountValue);
        alert(`${incomesForBatch.length} مورد درآمد با موفقیت ثبت شد`);
      }

      // Reset form and refresh list
      resetForm();
      fetchIncomes(currentPage);
    } catch (error) {
      console.error("Submit error:", error);
      alert(error.response?.data?.message || "خطا در ثبت اطلاعات");
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- Effects ----------
  useEffect(() => {
    fetchIncomes();
    fetchSellers();
  }, []);

  // ---------- Render helpers ----------
  const formatDate = (dateString) => {
    return new Intl.DateTimeFormat("eng-en", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(dateString));
  };

  const filledItemsCount = items.filter(item =>
    item.size.trim() !== "" || item.quantity !== "" || item.price !== ""
  ).length;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-cyan-800 mb-6">مدیریت واردات</h2>

      {/* Form Section */}
      <div id="income-form" className="mb-8 bg-white p-6 rounded-xl shadow-md">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seller Information */}
          <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-300">
              اطلاعات فروشنده
            </h3>
            <div className="flex flex-wrap gap-6 mb-5">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="existing"
                  checked={sellerMode === "existing"}
                  onChange={() => setSellerMode("existing")}
                  className="h-4 w-4 text-cyan-600 focus:ring-cyan-500"
                />
                <span className="mr-2 text-sm font-medium text-gray-700">فروشنده موجود</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="new"
                  checked={sellerMode === "new"}
                  onChange={() => setSellerMode("new")}
                  className="h-4 w-4 text-cyan-600 focus:ring-cyan-500"
                />
                <span className="mr-2 text-sm font-medium text-gray-700">فروشنده جدید</span>
              </label>
            </div>

            {sellerMode === "existing" && (
              <div className="max-w-md">
                <label className="block text-sm font-semibold text-gray-700 mb-1">انتخاب فروشنده *</label>
                <select
                  value={sellerId}
                  onChange={(e) => setSellerId(e.target.value)}
                  required
                  className="block w-full rounded-md border-2 border-gray-300 bg-white shadow-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 sm:text-sm p-2"
                >
                  <option value="">انتخاب فروشنده</option>
                  {sellers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullname}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {sellerMode === "new" && (
              <div className="max-w-md">
                <label className="block text-sm font-semibold text-gray-700 mb-1">نام فروشنده جدید *</label>
                <input
                  type="text"
                  placeholder="مثال: علی محمدی"
                  value={newSeller}
                  onChange={(e) => setNewSeller(e.target.value)}
                  required
                  className="block w-full rounded-md border-2 border-gray-300 bg-white shadow-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 sm:text-sm p-2"
                />
              </div>
            )}
          </div>

          {/* Items List */}
          <div className="space-y-4">
            {items.map((item, index) => {
              const isEmpty = !item.size && !item.quantity && !item.price;
              return (
                <div
                  key={index}
                  className={`grid grid-cols-1 md:grid-cols-6 gap-4 items-end p-4 rounded-lg border ${isEmpty ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200"
                    } shadow-sm`}
                >
                  <div className="md:col-span-2">
                    <label className="block mb-1 text-sm font-semibold text-gray-700">اندازه</label>
                    <select
                      name="size"
                      value={item.size}
                      onChange={(e) => handleChange(index, e)}
                      className={`w-full rounded-md border-2 ${isEmpty ? "border-blue-300" : "border-gray-300"} bg-white p-2 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500`}
                    >
                      <option value="">انتخاب اندازه</option>
                      {sizes.map((s) => (
                        <option key={s.id} value={s.label}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-700">تعداد (پلیت)</label>
                    <input
                      type="number"
                      name="quantity"
                      value={item.quantity}
                      onChange={(e) => handleChange(index, e)}
                      className={`w-full rounded-md border-2 ${isEmpty ? "border-blue-300" : "border-gray-300"} bg-white p-2 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500`}
                      placeholder="۰"
                      min="0"
                      step="1"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-700">قیمت پلیت (افغانی)</label>
                    <input
                      type="number"
                      name="price"
                      value={item.price}
                      onChange={(e) => handleChange(index, e)}
                      className={`w-full rounded-md border-2 ${isEmpty ? "border-blue-300" : "border-gray-300"} bg-white p-2 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500`}
                      placeholder="۰"
                      min="0"
                      step="0.001"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-700">مبلغ کل</label>
                    <input
                      type="text"
                      name="money"
                      value={item.money}
                      readOnly
                      className="w-full rounded-md border-2 border-gray-200 bg-gray-100 p-2 text-gray-700"
                    />
                  </div>
                  {items.length > 5 && !editingId && (
                    <div>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="w-full px-3 py-2 bg-red-100 text-red-700 font-medium rounded-md hover:bg-red-200 transition border border-red-200"
                      >
                        حذف
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Upfront Payment (only for batch creation) */}
          {!editingId && (
            <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                مبلغ پرداختی (پیش‌پرداخت) – اختیاری
              </label>
              <div className="max-w-md">
                <input
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  placeholder="۰ (افغانی)"
                  min="0"
                  step="0.01"
                  className="block w-full rounded-md border-2 border-gray-300 bg-white shadow-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 sm:text-sm p-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  این مبلغ به عنوان پرداخت اولیه در فاکتور ثبت می‌شود.
                </p>
              </div>
            </div>
          )}
          <DateIncomeDownload />
          {/* Buttons */}
          <div className="flex flex-wrap gap-4 pt-4 border-t-2 border-gray-200 mt-6">
            {!editingId && (
              <>
                <button
                  type="button"
                  onClick={addItem}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold px-5 py-2 rounded-md transition shadow-sm"
                >
                  + مورد جدید (مجموع: {items.length})
                </button>
                <button
                  type="button"
                  onClick={() => setItems(createEmptyItems(5))}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-5 py-2 rounded-md transition disabled:opacity-50"
                  disabled={items.length === 5 && !hasUnsavedChanges}
                >
                  بازنشانی به ۵ مورد خالی
                </button>
              </>
            )}
            <button
              type="submit"
              disabled={submitting || filledItemsCount === 0}
              className={`flex-1 py-3 rounded-md font-bold text-white transition shadow-md ${submitting || filledItemsCount === 0
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-cyan-800 hover:bg-cyan-900"
                }`}
            >
              {submitting
                ? "در حال پردازش..."
                : editingId
                  ? "بروزرسانی درآمد"
                  : `ثبت ${filledItemsCount} مورد درآمد`}
            </button>
            {(editingId || hasUnsavedChanges) && (
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold px-6 py-3 rounded-md transition shadow-sm"
              >
                {editingId ? "انصراف ویرایش" : "لغو تغییرات"}
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="flex justify-center mb-4">
        <button
          className={`px-6 py-2 rounded-l-lg font-semibold ${activeTab === "incomes"
            ? "bg-blue-600 text-white"
            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          onClick={() => setActiveTab("incomes")}
        >
          درآمدها
        </button>
        <button
          className={`px-6 py-2 rounded-r-lg font-semibold ${activeTab === "factors"
            ? "bg-blue-600 text-white"
            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          onClick={() => setActiveTab("factors")}
        >
          فاکتورها
        </button>
      </div>
      {/* Incomes Table */}
      {activeTab === "incomes" ? (<div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-bold text-cyan-800">لیست درآمدها ({totalItems} مورد)</h3>
          <span className="text-sm text-gray-600">صفحه {currentPage} از {totalPages}</span>
        </div>

        {loading ? (
          <div className="p-8 text-center">در حال بارگذاری...</div>
        ) : incomes.length === 0 ? (
          <div className="p-8 text-center">هیچ درآمدی ثبت نشده است</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-center">
                <thead className="bg-cyan-50 text-cyan-800">
                  <tr>
                    <th className="p-3 border-b">#</th>
                    <th className="p-3 border-b">فروشنده</th>
                    <th className="p-3 border-b">اندازه</th>
                    <th className="p-3 border-b">تعداد (پلیت)</th>
                    <th className="p-3 border-b">قیمت پلیت (افغانی)</th>
                    <th className="p-3 border-b">مبلغ کل (افغانی)</th>
                    <th className="p-3 border-b">مصرف شده</th>
                    <th className="p-3 border-b">موجودی</th>
                    <th className="p-3 border-b">تاریخ</th>
                  </tr>
                </thead>
                <tbody>
                  {incomes.map((income) => {
                    const remaining = parseFloat(income.quantity || 0) - parseFloat(income.spent || 0);
                    return (
                      <tr key={income.id} className="hover:bg-gray-50 border-b last:border-0">
                        <td className="p-3">{income.id}</td>
                        <td className="p-3">{income.seller?.fullname || income.seller?.name || "—"}</td>
                        <td className="p-3"><span className="bg-gray-100 px-2 py-1 rounded text-sm">{income.size}</span></td>
                        <td className="p-3"><span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">{income.quantity}</span></td>
                        <td className="p-3 text-green-700">{parseFloat(income.price || 0).toLocaleString("en-US")}</td>
                        <td className="p-3 text-purple-700 font-bold">{parseFloat(income.money || 0).toLocaleString("en-US")}</td>
                        <td className="p-3"><span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-sm">{income.spent || 0}</span></td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-sm ${remaining > 0 ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}>
                            {remaining > 0 ? remaining : 0}
                          </span>
                        </td>
                        <td className="p-3 text-gray-500 text-sm">{formatDate(income.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-6 border-t border-gray-200">
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            </div>
          </>
        )}
      </div>) : (
        <Factors />
      )}
    </div>
  );
};

export default Incoming;