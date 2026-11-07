import { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  FaEdit,
  FaSave,
  FaTimes,
  FaSpinner,
  FaFileInvoiceDollar,
  FaCalendarAlt,
  FaUndo,
  FaSearch,
  FaTimesCircle,
  FaCheckCircle,
  FaHourglassHalf,
  FaPrint,
  FaTrash,
} from "react-icons/fa";
import Pagination from "../pagination/Pagination";
import SelectedOrderItemsDownload from "./SelectedOrderItemsDownload";
import { useSelector } from "react-redux";
import SearchBar from "../searching/SearchBar";
import DateOrderDownload from "./report/DateOrderDownload";
import { generateOrderItemsPdf } from "./SelectedOrderItemsDownload";
import OrderItemsBySizeMonth from "./analysData/OrderItemsBySizeMonth";
const BASE_URL = import.meta.env.VITE_BASE_URL;
const OrderItemsList = ({ refreshTrigger }) => {
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [selectedItemsData, setSelectedItemsData] = useState([]);
  const { currentUser } = useSelector((state) => state.user);
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(40);
  const [totalItems, setTotalItems] = useState(0);
  const [approving, setApproving] = useState(false);
  const [printingItem, setPrintingItem] = useState(null);
  const [approvingId, setApprovingId] = useState(null);
  // 🔹 Delete state
  const [deletingId, setDeletingId] = useState(null);

  // 🔹 Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchActive, setSearchActive] = useState(false);
  const searchBarRef = useRef(null);

  // Editing state
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    size: "",
    qnty: "",
    price: "",
    money: "",
    fileName: "",
  });
  const [originalItem, setOriginalItem] = useState(null);

  /* ===========================
     Fetch order items (role-aware)
  =========================== */
  const fetchOrderItems = async () => {
    if (!currentUser || !currentUser.id) {
      setOrderItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const params = {
        page: currentPage,
        limit: perPage,
        userId: currentUser.id,
        role: currentUser.role,
      };

      const res = await axios.get(`${BASE_URL}/orderItems`, { params });

      setOrderItems(res.data.orderItems || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setTotalItems(res.data.pagination?.totalItems || 0);
    } catch (err) {
      console.error("Error fetching order items:", err);
      setError(err.response?.data?.message || "خطا در دریافت سفارشات");
      setOrderItems([]);
    } finally {
      setLoading(false);
    }
  };

  /* ===========================
     Print Single Order Item
  =========================== */
  const handlePrintItem = (item) => {
    generateOrderItemsPdf([item], currentUser);
  };

  /* ===========================
   Approve Single Item
=========================== */
const handleApproveSingle = async (item) => {
  if (item.approved) return;
  if (approvingId !== null) return; // block concurrent single approvals

  const confirmed = window.confirm(
    `آیا از تایید سفارش #${item.id} مطمئن هستید؟\nموجودی گدام پس از تایید کاهش می‌یابد.`
  );
  if (!confirmed) return;

  try {
    setApprovingId(item.id);

    await axios.post(`${BASE_URL}/orderItems/approve`, {
      orderItemIds: [item.id],
    });

    // Update locally
    setOrderItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, approved: true } : i))
    );
    setSelectedItemsData((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, approved: true } : i))
    );

    if (searchActive) {
      setSearchResults((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, approved: true } : i))
      );
    }

    alert(`✅ سفارش #${item.id} تایید شد`);
  } catch (err) {
    console.error("Error approving item:", err);
    alert(err.response?.data?.error || "خطا در تایید سفارش");
  } finally {
    setApprovingId(null);
  }
};
  /* ===========================
     Delete Single Order Item
  =========================== */
  const handleDeleteItem = async (item) => {
    if (deletingId !== null) return; // block other deletes / double-click

    const confirmed = window.confirm(
      `آیا از حذف سفارش #${item.id} مطمئن هستید؟\nاین عمل قابل بازگشت نیست.`
    );
    if (!confirmed) return;

    try {
      setDeletingId(item.id);

      await axios.delete(`${BASE_URL}/orderItems/${item.id}`);

      // Remove locally
      setOrderItems((prev) => prev.filter((i) => i.id !== item.id));
      setSelectedItemIds((prev) => prev.filter((id) => id !== item.id));
      setSelectedItemsData((prev) => prev.filter((i) => i.id !== item.id));

      // If we were editing this item, exit edit mode
      if (editingId === item.id) cancelEdit();

      // If search is active, remove from search results too
      if (searchActive) {
        setSearchResults((prev) => prev.filter((i) => i.id !== item.id));
      } else {
        // Refresh to get accurate pagination totals
        fetchOrderItems();
      }
    } catch (err) {
      console.error("Error deleting order item:", err);
      alert(err.response?.data?.message || "خطا در حذف سفارش");
    } finally {
      setDeletingId(null);
    }
  };

  /* ===========================
     Search
  =========================== */
  const handleSearchResults = (results, count) => {
    setSearchResults(results);
    setOrderItems(results);
    setTotalItems(count || results.length);
    setTotalPages(1);
    setCurrentPage(1);
    setSearchActive(results.length > 0);

    setSelectedItemIds([]);
    setSelectedItemsData([]);
  };

  const clearSearch = () => {
    if (searchBarRef.current) {
      searchBarRef.current.reset();
    }
    setSearchActive(false);
    setSearchResults([]);
    fetchOrderItems();
  };

  /* ===========================
     Selection — ALL items selectable
  =========================== */
  const toggleSelectItem = (item) => {
    setSelectedItemIds((prev) =>
      prev.includes(item.id)
        ? prev.filter((id) => id !== item.id)
        : [...prev, item.id]
    );

    setSelectedItemsData((prev) =>
      prev.find((i) => i.id === item.id)
        ? prev.filter((i) => i.id !== item.id)
        : [...prev, item]
    );
  };

  const toggleSelectAll = () => {
    const allIds = orderItems.map((i) => i.id);
    const allSelected =
      allIds.length > 0 && allIds.every((id) => selectedItemIds.includes(id));

    if (allSelected) {
      setSelectedItemIds((prev) => prev.filter((id) => !allIds.includes(id)));
      setSelectedItemsData((prev) =>
        prev.filter((i) => !allIds.includes(i.id))
      );
    } else {
      setSelectedItemIds((prev) => [...new Set([...prev, ...allIds])]);
      setSelectedItemsData((prev) => [
        ...prev,
        ...orderItems.filter((i) => !prev.find((p) => p.id === i.id)),
      ]);
    }
  };

  /* ===========================
     Effects
  =========================== */
  useEffect(() => {
    if (!searchActive) {
      fetchOrderItems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentPage,
    perPage,
    refreshTrigger,
    searchActive,
    currentUser?.id,
    currentUser?.role,
  ]);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedItemIds([]);
    setSelectedItemsData([]);
  }, [currentUser?.id, currentUser?.role]);

  /* ===========================
     Edit
  =========================== */
  const startEdit = (item) => {
    setEditingId(item.id);
    setOriginalItem({ ...item });
    setEditForm({
      size: item.size || "",
      qnty: item.qnty || "",
      price: item.price || "",
      money: item.money || "",
      fileName: item.fileName || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({
      size: "",
      qnty: "",
      price: "",
      money: "",
      fileName: "",
    });
    setOriginalItem(null);
  };

  const handleEditChange = (field, value) => {
    setEditForm((prev) => {
      const updated = { ...prev, [field]: value };

      if (field === "qnty" || field === "price") {
        const qnty = Number(updated.qnty) || 0;
        const price = Number(updated.price) || 0;
        updated.money = (qnty * price).toString();
      }

      return updated;
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;

    try {
      const payload = {
        size: editForm.size,
        qnty: Number(editForm.qnty),
        price: Number(editForm.price),
        money: Number(editForm.money),
        fileName: editForm.fileName,
      };

      await axios.put(`${BASE_URL}/orderItems/${editingId}`, payload);

      setOrderItems((prev) =>
        prev.map((item) =>
          item.id === editingId ? { ...item, ...payload } : item
        )
      );

      cancelEdit();
      alert("سفارش با موفقیت ویرایش شد");

      if (searchActive) {
        if (searchBarRef.current) {
          searchBarRef.current.search(searchQuery);
        }
      } else {
        fetchOrderItems();
      }
    } catch (err) {
      console.error("Error updating order item:", err);
      alert(err.response?.data?.message || "خطا در ویرایش سفارش");
    }
  };

  /* ===========================
     Approve Selected Items
  =========================== */
  const handleApproveSelected = async () => {
    const pendingIds = selectedItemsData
      .filter((i) => !i.approved)
      .map((i) => i.id);

    if (!pendingIds.length) {
      alert("هیچ مورد در انتظار تایید در انتخاب شما وجود ندارد.");
      return;
    }

    const confirmed = window.confirm(
      `آیا از تایید ${pendingIds.length} مورد مطمئن هستید؟\nموجودی گدام پس از تایید کاهش می‌یابد.`
    );
    if (!confirmed) return;

    try {
      setApproving(true);
      const res = await axios.post(`${BASE_URL}/orderItems/approve`, {
        orderItemIds: pendingIds,
      });

      alert(
        `✅ ${res.data.approvedCount} مورد تایید شد` +
        (res.data.skippedCount
          ? ` (${res.data.skippedCount} مورد قبلا تایید شده بود)`
          : "")
      );

      setSelectedItemIds([]);
      setSelectedItemsData([]);
      fetchOrderItems();
    } catch (err) {
      console.error("Error approving items:", err);
      alert(err.response?.data?.error || "خطا در تایید سفارشات");
    } finally {
      setApproving(false);
    }
  };

  /* ===========================
     Helpers
  =========================== */
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const formatted = date.toLocaleDateString("eng-en");
    return formatted.replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d));
  };

  const hasChanges = () => {
    if (!originalItem) return false;
    return (
      editForm.size !== originalItem.size ||
      editForm.qnty !== originalItem.qnty ||
      editForm.price !== originalItem.price ||
      editForm.money !== originalItem.money ||
      editForm.fileName !== originalItem.fileName
    );
  };

  const pendingSelectedCount = selectedItemsData.filter(
    (i) => !i.approved
  ).length;

  if (loading && orderItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <FaSpinner className="text-4xl text-cyan-800 animate-spin mb-4" />
        <p className="text-gray-600">در حال بارگذاری سفارشات...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-800 to-cyan-600 text-white p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-full">
              <FaFileInvoiceDollar className="text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {currentUser?.role === "designer"
                  ? "سفارشات من"
                  : "لیست سفارشات"}
              </h2>
              <p className="text-sm text-white/80">
                {searchActive ? (
                  <span>
                    نتایج جستجو: {searchResults.length} مورد یافت شد
                  </span>
                ) : (
                  <span>
                    {totalItems} سفارش | صفحه {currentPage} از {totalPages}
                  </span>
                )}
                {editingId && (
                  <span className="ml-4 bg-yellow-500 text-white px-2 py-1 rounded text-xs">
                    حالت ویرایش #{editingId}
                  </span>
                )}
              </p>
            </div>
          </div>
          {editingId && hasChanges() && (
            <div className="flex items-center gap-2">
              <span className="text-yellow-200 text-sm animate-pulse">
                تغییرات ذخیره نشده!
              </span>
            </div>
          )}
        </div>

        {/* SearchBar (admin only) */}
        {currentUser?.role === "admin" && (
          <div className="flex justify-end">
            <div className="grid grid-cols-1 sm:grid-cols-2 items-center">
              <div className="w-full">
                <SearchBar
                  ref={searchBarRef}
                  onResults={handleSearchResults}
                  placeholder="جستجو بر اساس شماره بیل یا نام فایل..."
                />
              </div>
              <DateOrderDownload />
            </div>
          </div>
        )}

        {/* Search Active Indicator */}
        {searchActive && searchResults.length > 0 && (
          <div className="mt-3 flex items-center justify-between text-sm bg-white/10 p-2 rounded-lg">
            <span className="text-cyan-100">
              نتایج جستجو: {searchResults.length} مورد یافت شد
            </span>
            <button
              onClick={clearSearch}
              className="text-white hover:text-cyan-200 underline flex items-center gap-1 text-sm"
            >
              <FaTimesCircle /> نمایش همه سفارشات
            </button>
          </div>
        )}

        {/* Approve Toolbar (admin only) */}
        {currentUser?.role === "admin" && pendingSelectedCount > 0 && (
          <div className="mt-3 flex items-center justify-between bg-green-600/30 border border-green-400/50 p-2 rounded-lg">
            <span className="text-sm text-white">
              {pendingSelectedCount} مورد در انتظار تایید
              {selectedItemsData.length > pendingSelectedCount && (
                <span className="text-cyan-100 mr-2">
                  (از {selectedItemsData.length} انتخاب شده)
                </span>
              )}
            </span>
            <button
              onClick={handleApproveSelected}
              disabled={approving}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-md text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {approving ? (
                <>
                  <FaSpinner className="animate-spin" />
                  در حال تایید...
                </>
              ) : (
                <>
                  <FaCheckCircle />
                  تایید انتخاب شده‌ها
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* No Search Results */}
      {searchActive && searchResults.length === 0 && (
        <div className="bg-yellow-50 border-b border-yellow-200 p-4 text-center">
          <div className="flex flex-col items-center gap-2 text-yellow-800">
            <FaSearch className="text-xl" />
            <p className="font-medium">نتیجه‌ای یافت نشد</p>
            <p className="text-sm text-yellow-600">
              هیچ سفارشی با این مشخصات یافت نشد
            </p>
            <button
              onClick={clearSearch}
              className="text-sm bg-yellow-100 hover:bg-yellow-200 px-4 py-2 rounded mt-2"
            >
              نمایش همه سفارشات
            </button>
          </div>
        </div>
      )}

      {/* Order Items Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-center">
          <thead className="bg-cyan-50 text-cyan-800">
            <tr>
              <th className="p-3 border-b font-semibold">
                <input
                  type="checkbox"
                  onChange={toggleSelectAll}
                  checked={
                    orderItems.length > 0 &&
                    orderItems.every((i) => selectedItemIds.includes(i.id))
                  }
                  title="انتخاب همه"
                />
              </th>
              <th className="p-3 border-b font-semibold">#</th>
              <th className="p-3 border-b font-semibold">نام فایل</th>
              <th className="p-3 border-b font-semibold">سایز</th>
              <th className="p-3 border-b font-semibold">تعداد</th>
              <th className="p-3 border-b font-semibold">نمبر بیل</th>
              <th className="p-3 border-b font-semibold">نام مشتری</th>
              <th className="p-3 border-b font-semibold">قیمت (افغانی)</th>
              <th className="p-3 border-b font-semibold">مبلغ (افغانی)</th>
              <th className="p-3 border-b font-semibold">وضعیت</th>
              <th className="p-3 border-b font-semibold">
                <div className="flex items-center justify-center gap-1">
                  <FaCalendarAlt />
                  <span>تاریخ ثبت</span>
                </div>
              </th>
              <th className="p-3 border-b font-semibold">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {orderItems.length === 0 && !loading ? (
              <tr>
                <td colSpan="12" className="p-8 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FaFileInvoiceDollar className="text-4xl text-gray-300" />
                    <p className="text-lg">
                      {searchActive
                        ? "هیچ نتیجه‌ای یافت نشد"
                        : currentUser?.role === "designer"
                          ? "شما هنوز سفارشی ثبت نکرده‌اید"
                          : "هیچ سفارشی یافت نشد"}
                    </p>
                    <p className="text-sm text-gray-400">
                      {searchActive
                        ? "لطفاً عبارت جستجوی دیگری را امتحان کنید"
                        : "شروع به ثبت سفارش جدید کنید"}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              orderItems.map((item) => {
                const isDeleting = deletingId === item.id;
                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-gray-50 border-b last:border-0 transition-colors ${editingId === item.id ? "bg-yellow-50" : ""
                      } ${searchActive ? "bg-blue-50/30" : ""} ${item.approved ? "bg-green-50/40" : ""
                      } ${isDeleting ? "opacity-50" : ""}`}
                  >
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedItemIds.includes(item.id)}
                          onChange={() => toggleSelectItem(item)}
                          disabled={isDeleting}
                        />
                        {currentUser?.role === "admin" && !item.approved && (
                          <button
                            onClick={() => handleApproveSingle(item)}
                            disabled={approving || isDeleting}
                            className={`p-1.5 rounded-full transition-colors ${approving
                              ? "text-gray-300 cursor-not-allowed"
                              : "text-green-600 hover:bg-green-100"
                              }`}
                            title="تایید این سفارش"
                          >
                            {approving ? (
                              <FaSpinner className="animate-spin text-xs" />
                            ) : (
                              <FaCheckCircle className="text-sm" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-gray-600">{item.id}</td>

                    {/* File Name */}
                    <td className="p-3">
                      {editingId === item.id ? (
                        <input
                          type="text"
                          value={editForm.fileName}
                          onChange={(e) =>
                            handleEditChange("fileName", e.target.value)
                          }
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                          placeholder="نام فایل"
                        />
                      ) : (
                        <div className="font-medium text-gray-800 max-w-xs truncate">
                          {item.fileName || "—"}
                        </div>
                      )}
                    </td>

                    {/* Size */}
                    <td className="p-3">
                      {editingId === item.id ? (
                        <input
                          type="text"
                          value={editForm.size}
                          onChange={(e) =>
                            handleEditChange("size", e.target.value)
                          }
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                          placeholder="سایز"
                          required
                        />
                      ) : (
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
                          {item.size}
                        </span>
                      )}
                    </td>

                    {/* Quantity */}
                    <td className="p-3">
                      {editingId === item.id ? (
                        <input
                          type="number"
                          min="1"
                          value={editForm.qnty}
                          onChange={(e) =>
                            handleEditChange("qnty", e.target.value)
                          }
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-center"
                          placeholder="تعداد"
                          required
                        />
                      ) : (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-semibold">
                          {item.qnty}
                        </span>
                      )}
                    </td>

                    {/* Invoice Number */}
                    <td className="p-3">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-semibold">
                        {item.invoiceNumber || 0}
                      </span>
                    </td>

                    {/* Customer Name */}
                    <td className="p-3">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-semibold">
                        {item.customerName}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="p-3">
                      {editingId === item.id ? (
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editForm.price}
                          onChange={(e) =>
                            handleEditChange("price", e.target.value)
                          }
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-center"
                          placeholder="قیمت"
                          required
                        />
                      ) : (
                        <span className="text-green-700 font-semibold">
                          {parseFloat(item.price || 0).toLocaleString("en-US")}
                        </span>
                      )}
                    </td>

                    {/* Money */}
                    <td className="p-3">
                      {editingId === item.id ? (
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editForm.money}
                          onChange={(e) =>
                            handleEditChange("money", e.target.value)
                          }
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-center bg-gray-50"
                          placeholder="مبلغ"
                          required
                          readOnly
                          onFocus={(e) => e.target.removeAttribute("readonly")}
                        />
                      ) : (
                        <span className="text-purple-700 font-bold">
                          {parseFloat(item.money || 0).toLocaleString("en-US")}
                        </span>
                      )}
                    </td>

                    {/* Approval Status */}
                    <td className="p-3">
                      {item.approved ? (
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                          <FaCheckCircle />
                          تایید شده
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-semibold">
                          <FaHourglassHalf />
                          در انتظار
                        </span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="p-3 text-gray-500 text-sm">
                      {formatDate(item.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-2">
                        {/* 🖨️ Print button — available to everyone */}
                        <button
                          onClick={() => handlePrintItem(item)}
                          className="p-2 text-cyan-700 hover:bg-cyan-50 rounded-lg"
                          title="چاپ این سفارش"
                          disabled={isDeleting}
                        >
                          <FaPrint />
                        </button>

                        {/* 🗑️ Delete button — admin only */}
                        {currentUser?.role === "admin" && (
                          <button
                            onClick={() => handleDeleteItem(item)}
                            disabled={deletingId !== null || editingId !== null}
                            className={`p-2 rounded-lg ${deletingId !== null || editingId !== null
                              ? "text-gray-300 cursor-not-allowed"
                              : "text-red-600 hover:bg-red-50"
                              }`}
                            title="حذف این سفارش"
                          >
                            {isDeleting ? (
                              <FaSpinner className="animate-spin" />
                            ) : (
                              <FaTrash />
                            )}
                          </button>
                        )}

                        {/* ✏️ Edit button — admin only */}
                        {currentUser?.role === "admin" && (
                          <>
                            {editingId === item.id ? (
                              <>
                                <button
                                  onClick={saveEdit}
                                  className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                                  title="ذخیره"
                                  disabled={!hasChanges()}
                                >
                                  <FaSave />
                                </button>

                                <button
                                  onClick={cancelEdit}
                                  className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                                  title="لغو"
                                >
                                  <FaTimes />
                                </button>

                                {hasChanges() && (
                                  <button
                                    onClick={() => {
                                      setEditForm({
                                        size: originalItem.size || "",
                                        qnty: originalItem.qnty || "",
                                        price: originalItem.price || "",
                                        money: originalItem.money || "",
                                        fileName: originalItem.fileName || "",
                                      });
                                    }}
                                    className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                                    title="بازنشانی"
                                  >
                                    <FaUndo />
                                  </button>
                                )}
                              </>
                            ) : (
                              <button
                                onClick={() => startEdit(item)}
                                className="p-2 text-cyan-700 hover:bg-cyan-50 rounded-lg"
                                title="ویرایش"
                                disabled={editingId !== null || deletingId !== null}
                              >
                                <FaEdit />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Selected Items Download Section */}
      {selectedItemsData.length > 0 && (
        <div className="p-6 border-t bg-gray-50">
          <SelectedOrderItemsDownload items={selectedItemsData} />
        </div>
      )}

      {/* Hidden single-item printer — auto-triggers when printingItem is set */}
      {printingItem && (
        <SingleItemPrinter
          item={printingItem}
          onDone={() => setPrintingItem(null)}
        />
      )}

      <div className="p-6 border-t border-gray-200">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => setCurrentPage(page)}
        />
        <OrderItemsBySizeMonth/>
      </div>

      {/* Editing Warning */}
      {editingId && (
        <div className="bg-yellow-50 border border-yellow-200 p-3">
          <div className="flex items-center justify-center gap-2 text-yellow-800">
            <FaEdit />
            <span className="font-medium">
              شما در حال ویرایش سفارش #{editingId} هستید
            </span>
            <button
              onClick={cancelEdit}
              className="text-sm bg-yellow-100 hover:bg-yellow-200 px-2 py-1 rounded"
            >
              لغو ویرایش
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ============================================================
   Hidden helper component that triggers the PDF download for
   a single order item and then signals the parent to clear.
============================================================ */
const SingleItemPrinter = ({ item, onDone }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      const btn = document.getElementById("__single_print_btn");
      if (btn) btn.click();
      onDone?.();
    }, 0);

    return () => clearTimeout(timer);
  }, [item, onDone]);

  return (
    <div style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}>
      <div id="__single_print_wrapper">
        <SelectedOrderItemsDownload items={item} />
      </div>
    </div>
  );
};

export default OrderItemsList;