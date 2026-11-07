import { useEffect, useState } from "react";
import axios from "axios";
import {
  FaPrint,
  FaEdit,
  FaTrash,
  FaSave,
  FaTimes,
  FaSpinner,
  FaFileInvoiceDollar,
  FaCalendarAlt,
  FaUser,
  FaMoneyBillWave,
  FaPlus,
  FaUndo,
  FaCalculator,
  FaPen,
  FaFilter,
  FaChevronDown,
  FaChevronUp,
  FaSearch,
  FaInfoCircle
} from "react-icons/fa";
import Pagination from "../pagination/Pagination";
import PrintBillOrder from "./PrintOrderBill";
import ReceiptDateDownload from "./report/ReceiptDateDownload";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const initialForm = {
  customer: "",
  amount: "",
  calculated: false,
  description: ""
};

const ReceiptManager = () => {
  const [customersWithRemaining, setCustomersWithRemaining] = useState([]);
  const [selectedCustomerDetails, setSelectedCustomerDetails] = useState(null);
  const [receipts, setReceipts] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [printModal, setPrintModal] = useState({
    isOpen: false,
    order: null,
    autoPrint: false,
  });

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [filterCalculated, setFilterCalculated] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");

  // Customer fetch state
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [grandTotalRemaining, setGrandTotalRemaining] = useState(0);

  // Original values for reset during edit
  const [originalReceipt, setOriginalReceipt] = useState(null);

  /* ---------------- FETCH CUSTOMERS WITH REMAINING MONEY ---------------- */
  const fetchCustomersWithRemaining = async () => {
    try {
      setLoadingCustomers(true);
      const response = await axios.get(`${BASE_URL}/remain/customer`);

      if (response.data?.customers) {
        setCustomersWithRemaining(response.data.customers);
        setGrandTotalRemaining(response.data.grandTotalRemaining || 0);
      } else {
        setCustomersWithRemaining([]);
        setGrandTotalRemaining(0);
      }
    } catch (error) {
      console.error("Error fetching customers with remaining money", error);
      setCustomersWithRemaining([]);
      setGrandTotalRemaining(0);
    } finally {
      setLoadingCustomers(false);
    }
  };

  /* ---------------- FETCH RECEIPTS WITH FILTERS ---------------- */
  const fetchReceipts = async () => {
    try {
      setFetchLoading(true);
      const params = {
        page: currentPage,
        limit: perPage,
      };

      // Add filter params
      if (filterCalculated !== "") {
        params.calculated = filterCalculated;
      }
      if (filterCustomer) {
        params.customerId = filterCustomer;
      }

      const res = await axios.get(`${BASE_URL}/receipts`, { params });

      setReceipts(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalItems(res.data.count || 0);
      setError("");
    } catch (error) {
      console.error("Error fetching receipts", error);
      setError("خطا در دریافت رسیدها");
      setReceipts([]);
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomersWithRemaining();
  }, []);

  useEffect(() => {
    fetchReceipts();
  }, [currentPage, perPage, filterCalculated, filterCustomer]);

  /* ---------------- HANDLE CUSTOMER SELECT ---------------- */
  const handleCustomerSelect = (e) => {
    const customerId = e.target.value;
    setForm(prev => ({
      ...prev,
      customer: customerId
    }));

    // Find and set selected customer details
    if (customerId) {
      const selected = customersWithRemaining.find(
        c => c.customer.id.toString() === customerId.toString()
      );
      setSelectedCustomerDetails(selected || null);
    } else {
      setSelectedCustomerDetails(null);
    }
  };

  /* ---------------- PRINT RECEIPT ---------------- */
  const handlePrintReceipt = (receipt) => {
    const customerData = receipt?.Customer;

    const orderForPrint = {
      id: receipt.id,
      amount: receipt.amount,
      createdAt: receipt.createdAt,
      updatedAt: receipt.updatedAt,
      Customer: customerData || {
        id: receipt.customer,
        fullname: getCustomerName(receipt.customer),
      }
    };

    setPrintModal({
      isOpen: true,
      order: orderForPrint,
      autoPrint: false,
    });
  };

  /* ---------------- CLOSE PRINT MODAL ---------------- */
  const closePrintModal = () => {
    setPrintModal({
      isOpen: false,
      order: null,
      autoPrint: false,
    });
  };

  /* ---------------- HANDLE FORM ---------------- */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    // Validate amount doesn't exceed remaining money
    if (selectedCustomerDetails && parseFloat(form.amount) > selectedCustomerDetails.remainingMoney) {
      setError(`مبلغ وارد شده (${form.amount}) از باقیمانده قابل پرداخت (${selectedCustomerDetails.remainingMoney}) بیشتر است`);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        customer: form.customer,
        amount: parseFloat(form.amount),
        calculated: form.calculated,
        description: form.description
      };

      if (editingId) {
        await axios.put(`${BASE_URL}/receipts/${editingId}`, payload);
      } else {
        await axios.post(`${BASE_URL}/receipts`, payload);
      }

      setForm(initialForm);
      setEditingId(null);
      setOriginalReceipt(null);
      setSelectedCustomerDetails(null);
      fetchReceipts();
      fetchCustomersWithRemaining(); // Refresh remaining money data

      alert(editingId ? "رسید با موفقیت ویرایش شد" : "رسید با موفقیت ثبت شد");
    } catch (error) {
      console.error("Error saving receipt", error);
      setError(error.response?.data?.message || "خطا در ذخیره رسید");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- CANCEL EDIT ---------------- */
  const cancelEdit = () => {
    setForm(initialForm);
    setEditingId(null);
    setOriginalReceipt(null);
    setSelectedCustomerDetails(null);
  };

  /* ---------------- RESET FORM ---------------- */
  const resetForm = () => {
    if (originalReceipt) {
      setForm({
        customer: originalReceipt.customer.toString(),
        amount: originalReceipt.amount.toString(),
        calculated: originalReceipt.calculated || false,
      });

      // Reset selected customer details
      const selected = customersWithRemaining.find(
        c => c.customer.id.toString() === originalReceipt.customer.toString()
      );
      setSelectedCustomerDetails(selected || null);
    }
  };

  /* ---------------- CLEAR FILTERS ---------------- */
  const clearFilters = () => {
    setFilterCalculated("");
    setFilterCustomer("");
    setCurrentPage(1);
  };

  // Check if form has changes
  const hasChanges = () => {
    if (!originalReceipt) return true;
    return (
      form.customer !== originalReceipt.customer.toString() ||
      form.amount !== originalReceipt.amount.toString() ||
      form.calculated !== (originalReceipt.calculated || false)
    );
  };

  // Get customer name from customers with remaining
  const getCustomerName = (customerId) => {
    const customerData = customersWithRemaining.find(
      c => c.customer.id.toString() === customerId.toString()
    );
    return customerData?.customer?.fullname || "مشتری ناشناس";
  };

  // Get remaining money for a customer
  const getCustomerRemainingMoney = (customerId) => {
    const customerData = customersWithRemaining.find(
      c => c.customer.id.toString() === customerId.toString()
    );
    return customerData?.remainingMoney || 0;
  };

  // Filter customers based on search
  const getFilteredCustomers = () => {
    if (customerSearch.trim() === "") {
      return customersWithRemaining;
    }

    const searchTerm = customerSearch.toLowerCase();
    return customersWithRemaining.filter(item =>
      item.customer.fullname?.toLowerCase().includes(searchTerm) ||
      item.customer.phoneNumber?.includes(customerSearch) ||
      item.customer.id?.toString().includes(searchTerm)
    );
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const formatted = date.toLocaleDateString("eng-en");
    return formatted.replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d));
  };

  // Calculate statistics
  const totalAmount = receipts.reduce((sum, receipt) => sum + parseFloat(receipt.amount || 0), 0);
  const calculatedAmount = receipts.filter(r => r.calculated).reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
  const manualAmount = receipts.filter(r => !r.calculated).reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);

  // Get customers for display in select
  const displayCustomers = getFilteredCustomers();

  if (fetchLoading && receipts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <FaSpinner className="text-4xl text-cyan-800 animate-spin mb-4" />
        <p className="text-gray-600">در حال بارگذاری رسیدها...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6 space-y-8">
      {/* Header with Grand Total Remaining */}
      <div className="bg-gradient-to-r from-cyan-800 to-cyan-600 text-white p-6 rounded-xl shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">مدیریت رسیدها</h1>
            <p className="text-white/80">ثبت و مدیریت رسیدهای پرداختی</p>
          </div>
          <div className="bg-white/20 p-4 rounded-lg text-center">
            <p className="text-sm text-white/80">مجموع باقیمانده</p>
            <p className="text-2xl font-bold">{grandTotalRemaining.toLocaleString('en-US')} افغانی</p>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        {showFilters && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Customer Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  مشتری
                </label>
                <select
                  value={filterCustomer}
                  onChange={(e) => setFilterCustomer(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                >
                  <option value="">همه مشتریان</option>
                  {customersWithRemaining.map((item) => (
                    <option key={item.customer.id} value={item.customer.id}>
                      {item.customer.fullname} (باقیمانده: {item.remainingMoney.toLocaleString('en-US')})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Statistics */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-800">مجموع مبلغ رسیدها</p>
                    <p className="text-xl font-bold text-blue-900">
                      {totalAmount.toLocaleString('en-US')} افغانی
                    </p>
                  </div>
                  <FaMoneyBillWave className="text-blue-600 text-2xl" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-800">مبلغ محاسبه‌شده</p>
                    <p className="text-xl font-bold text-green-900">
                      {calculatedAmount.toLocaleString('en-US')} افغانی
                    </p>
                  </div>
                  <FaCalculator className="text-green-600 text-2xl" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-800">مبلغ دستی</p>
                    <p className="text-xl font-bold text-purple-900">
                      {manualAmount.toLocaleString('en-US')} افغانی
                    </p>
                  </div>
                  <FaPen className="text-purple-600 text-2xl" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toggle Filters Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full p-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium flex items-center justify-center gap-2"
        >
          <FaFilter />
          {showFilters ? "پنهان کردن فیلترها" : "نمایش فیلترها"}
        </button>
      </div>

      {/* Form Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Form Header */}
        <div className="bg-gradient-to-r from-cyan-800 to-cyan-600 text-white p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-full">
              <FaMoneyBillWave className="text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {editingId ? "ویرایش رسید" : "ثبت رسید جدید"}
              </h2>
              <p className="text-sm text-white/80">
                {editingId ? "ویرایش اطلاعات رسید پرداختی" : "ثبت رسید پرداختی جدید"}
              </p>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Selection */}
            <div>
              <div className="space-y-3">
                {/* Customer Select */}
                <select
                  name="customer"
                  value={form.customer}
                  onChange={handleCustomerSelect}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                >
                  <option value="">انتخاب مشتری</option>
                  {displayCustomers.map((item) => (
                    <option key={item.customer.id} value={item.customer.id}>
                      {item.customer.fullname}
                    </option>
                  ))}
                </select>

                {/* Loading indicator */}
                {loadingCustomers && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <FaSpinner className="animate-spin" />
                    <span>در حال بارگذاری مشتریان...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Amount Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="text-red-500">*</span> مبلغ (افغانی)
              </label>
              <div className="relative">
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  <FaMoneyBillWave />
                </div>
                <input
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="مبلغ را وارد کنید"
                  required
                  min="0"
                  max={selectedCustomerDetails?.remainingMoney || undefined}
                  step="0.01"
                  className="w-full border border-gray-300 rounded-lg px-10 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>
              {selectedCustomerDetails && (
                <p className="mt-2 text-sm text-gray-500">
                  حداکثر مبلغ قابل پرداخت: {selectedCustomerDetails.remainingMoney.toLocaleString('en-US')} افغانی
                </p>
              )}
            </div>
            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                توضیحات
              </label>

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="توضیحات مربوط به رسید..."
                rows="3"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              {editingId && (
                <>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                  >
                    <div className="flex items-center gap-2">
                      <FaTimes />
                      <span>لغو ویرایش</span>
                    </div>
                  </button>
                  {hasChanges() && originalReceipt && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                    >
                      <div className="flex items-center gap-2">
                        <FaUndo />
                        <span>بازنشانی</span>
                      </div>
                    </button>
                  )}
                </>
              )}
              <button
                type="submit"
                disabled={loading || !hasChanges()}
                className="px-6 py-3 bg-gradient-to-r from-cyan-800 to-cyan-600 text-white rounded-lg transition font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-2">
                  {loading ? (
                    <FaSpinner className="animate-spin" />
                  ) : editingId ? (
                    <FaSave />
                  ) : (
                    <FaPlus />
                  )}
                  <span>
                    {loading
                      ? "در حال پردازش..."
                      : editingId
                        ? "ذخیره تغییرات"
                        : "ثبت رسید"}
                  </span>
                </div>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Table Header */}
        <div className="p-4">
          <ReceiptDateDownload />
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-center">
            <thead className="bg-cyan-50 text-cyan-800">
              <tr>
                <th className="p-3 border-b font-semibold">#</th>
                <th className="p-3 border-b font-semibold">مشتری</th>
                <th className="p-3 border-b font-semibold">مبلغ (افغانی)</th>
                <th className="p-3 border-b font-semibold">توضیحات</th>
                <th className="p-3 border-b font-semibold">باقیمانده</th>
                <th className="p-3 border-b font-semibold">تاریخ ثبت</th>
                <th className="p-3 border-b font-semibold">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {receipts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FaFileInvoiceDollar className="text-4xl text-gray-300" />
                      <p className="text-lg text-gray-500">هیچ رسیدی یافت نشد</p>
                      <p className="text-sm text-gray-400">برای شروع، رسید جدیدی ثبت کنید</p>
                    </div>
                  </td>
                </tr>
              ) : (
                receipts.map((receipt, index) => {
                  const remainingMoney = getCustomerRemainingMoney(receipt.customer);
                  return (
                    <tr
                      key={receipt.id}
                      className={`
                        border-b last:border-0 transition-colors
                        hover:bg-gray-50
                        ${editingId === receipt.id ? "bg-yellow-50" : ""}
                        ${receipt.calculated ? "bg-blue-50/40" : ""}
                      `}
                    >
                      {/* ID */}
                      <td className="p-3 text-gray-600 font-medium">
                        {receipt.id}
                      </td>

                      {/* Customer */}
                      <td className="p-3">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-800">
                            {receipt.Customer.fullname}
                          </span>
                          <span className="text-xs text-gray-500">
                            کد: {receipt.customer}
                          </span>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="p-3">
                        <span
                          className={`
                            inline-block px-3 py-1 rounded-full text-sm font-bold
                            ${receipt.calculated
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"}
                          `}
                        >
                          {Number(receipt.amount || 0).toLocaleString("en-US")}
                        </span>
                      </td>
                      <td className="p-3 text-gray-600 text-sm max-w-xs truncate">
                        {receipt.description || "-"}
                      </td>
                      {/* Remaining Money */}
                      <td className="p-3">
                        <span className="inline-block px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-bold">
                          {remainingMoney.toLocaleString('en-US')}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="p-3 text-gray-500 text-sm whitespace-nowrap">
                        {formatDate(receipt.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handlePrintReceipt(receipt)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                            title="چاپ رسید"
                            disabled={editingId !== null}
                          >
                            <FaPrint />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-6 border-t border-gray-200">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      </div>

      {/* Editing Warning */}
      {editingId && (
        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
          <div className="flex items-center justify-center gap-3 text-yellow-800">
            <FaEdit />
            <span className="font-medium">شما در حال ویرایش رسید #{editingId} هستید</span>
            <button
              onClick={cancelEdit}
              className="text-sm bg-yellow-100 hover:bg-yellow-200 px-3 py-1 rounded"
            >
              لغو ویرایش
            </button>
          </div>
          {hasChanges() && (
            <div className="mt-2 text-center text-yellow-700 text-sm">
              تغییرات اعمال شده هنوز ذخیره نشده‌اند
            </div>
          )}
        </div>
      )}

      <PrintBillOrder
        isOpen={printModal.isOpen}
        onClose={closePrintModal}
        order={printModal.order}
        autoPrint={printModal.autoPrint}
      />
    </div>
  );
};

export default ReceiptManager;