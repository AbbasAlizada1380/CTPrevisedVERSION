import { useEffect, useState } from "react";
import axios from "axios";
import Pagination from "../pagination/Pagination";
import RemainOrderItems from "./RemainOrderItems"; // adjust path if needed
import { FaUsers, FaPlus, FaEdit, FaTrash, FaMoneyBillWave } from "react-icons/fa";
import { useSelector } from "react-redux";

const BASE_URL = import.meta.env.VITE_BASE_URL;
const limit = 20;

/* ===========================
   Default Price List (fixed sizes)
=========================== */
const DEFAULT_PRICE_LIST = [
  { size: "1030 × 820 mm", price: 0 },
  { size: "1030 × 770 mm", price: 0 },
  { size: "745 × 605 mm", price: 0 },
  { size: "724 × 615 mm", price: 0 },
  { size: "650 × 550 mm", price: 0 },
  { size: "645 × 510 mm", price: 0 },
  { size: "510 × 400 mm", price: 0 },
  { size: "450 × 370 mm", price: 0 },
];

const emptyPriceList = () =>
  DEFAULT_PRICE_LIST.map((item) => ({ ...item }));

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const { currentUser } = useSelector((state) => state.user);
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [priceEditingId, setPriceEditingId] = useState(null);

  const [form, setForm] = useState({
    fullname: "",
    phoneNumber: "",
    isActive: true,
    priceList: emptyPriceList(),
  });

  /* ======================
     Fetch Customers
  ====================== */
  const fetchCustomers = async (page = 1) => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${BASE_URL}/customers?page=${page}&limit=${limit}`
      );

      setCustomers(res.data.customers);
      setCurrentPage(res.data.pagination.currentPage);
      setTotalPages(res.data.pagination.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(currentPage);
  }, [currentPage]);

  /* ======================
     Submit (Create / Update)
  ====================== */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    try {
      setSubmitting(true);

      if (editingId) {
        await axios.put(`${BASE_URL}/customers/${editingId}`, form);
      } else {
        await axios.post(`${BASE_URL}/customers`, form);
      }

      resetForm();
      fetchCustomers(currentPage);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  /* ======================
     Submit Price List Only
  ====================== */
  const handlePriceSubmit = async (e) => {
    e.preventDefault();
    if (submitting || !priceEditingId) return;

    try {
      setSubmitting(true);
      await axios.patch(`${BASE_URL}/customers/${priceEditingId}`, {
        priceList: form.priceList,
      });
      resetPriceForm();
      fetchCustomers(currentPage);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  /* ======================
     Edit Customer
  ====================== */
  const handleEdit = (customer) => {
    setEditingId(customer.id);
    setForm({
      fullname: customer.fullname,
      phoneNumber: customer.phoneNumber,
      isActive: customer.isActive,
      priceList:
        Array.isArray(customer.priceList) && customer.priceList.length
          ? customer.priceList.map((p) => ({
              size: p.size,
              price: Number(p.price) || 0,
            }))
          : emptyPriceList(),
    });
    setIsModalOpen(true);
  };

  /* ======================
     Edit Price List Only
  ====================== */
  const handleEditPrice = (customer) => {
    setPriceEditingId(customer.id);
    setForm((prev) => ({
      ...prev,
      priceList:
        Array.isArray(customer.priceList) && customer.priceList.length
          ? customer.priceList.map((p) => ({
              size: p.size,
              price: Number(p.price) || 0,
            }))
          : emptyPriceList(),
    }));
    setIsPriceModalOpen(true);
  };

  /* ======================
     Delete
  ====================== */
  const handleDelete = async (id) => {
    if (!window.confirm("آیا مطمئن هستید؟")) return;

    try {
      await axios.delete(`${BASE_URL}/customers/${id}`);
      fetchCustomers(currentPage);
    } catch (err) {
      console.error(err);
    }
  };

  /* ======================
     Reset Forms
  ====================== */
  const resetForm = () => {
    setForm({
      fullname: "",
      phoneNumber: "",
      isActive: true,
      priceList: emptyPriceList(),
    });
    setEditingId(null);
    setIsModalOpen(false);
  };

  const resetPriceForm = () => {
    setForm((prev) => ({
      ...prev,
      priceList: emptyPriceList(),
    }));
    setPriceEditingId(null);
    setIsPriceModalOpen(false);
  };

  /* ======================
     Handle Price Change
  ====================== */
  const handlePriceChange = (index, value) => {
    setForm((prev) => {
      const updated = [...prev.priceList];
      updated[index] = { ...updated[index], price: Number(value) || 0 };
      return { ...prev, priceList: updated };
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6 space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          مدیریت مشتریان
        </h1>
        <p className="text-gray-600">مدیریت اطلاعات مشتریان</p>

        {editingId && (
          <div className="mt-4 p-4 bg-yellow-100 border border-yellow-400 rounded-xl">
            <div className="flex items-center justify-center gap-2 text-yellow-800">
              <FaEdit />
              <span className="font-semibold">
                حالت ویرایش – مشتری #{editingId}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-100">
        {/* Table Header */}
        <div className="flex bg-gray-200 items-center justify-between rounded-t-md p-6">
          <div className="flex items-center gap-x-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <FaUsers className="text-cyan-800 text-xl" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              لیست مشتریان
            </h2>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-cyan-800 text-white px-4 py-2 rounded-lg hover:bg-cyan-900"
          >
            <FaPlus />
            افزودن مشتری
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-center border border-gray-300">
            <thead className="bg-cyan-800 text-white">
              <tr>
                <th className="border px-4 py-2">#</th>
                <th className="border px-4 py-2">نام کامل</th>
                <th className="border px-4 py-2">شماره تماس</th>
                <th className="border px-4 py-2">وضعیت</th>
                <th className="border px-4 py-2">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-4">
                    در حال بارگذاری...
                  </td>
                </tr>
              ) : customers.length ? (
                customers.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedCustomer(c)}
                  >
                    <td className="border px-4 py-2">{c.id}</td>
                    <td className="border px-4 py-2">{c.fullname}</td>
                    <td className="border px-4 py-2">{c.phoneNumber}</td>
                    <td className="border px-4 py-2">
                      {c.isActive ? "فعال" : "غیرفعال"}
                    </td>
                    <td className="border px-4 py-2">
                      {currentUser.role === "admin" ? (
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(c);
                            }}
                            className="h-8 w-8 flex items-center justify-center border border-cyan-800 rounded-md hover:scale-105"
                            title="ویرایش مشتری"
                          >
                            <FaEdit className="text-cyan-800" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditPrice(c);
                            }}
                            className="h-8 w-8 flex items-center justify-center border border-green-700 rounded-md hover:scale-105"
                            title="ویرایش لیست قیمت"
                          >
                            <FaMoneyBillWave className="text-green-700" />
                          </button>
                        </div>
                      ) : (
                        "--"
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-4 text-gray-500">
                    هیچ مشتری‌ای وجود ندارد
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {/* Customer Modal (Create / Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleSubmit}
            className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-lg font-bold mb-4">
              {editingId ? "ویرایش مشتری" : "افزودن مشتری"}
            </h3>

            <input
              required
              placeholder="نام کامل"
              value={form.fullname}
              onChange={(e) =>
                setForm({ ...form, fullname: e.target.value })
              }
              className="w-full border p-2 rounded mb-3"
            />

            <input
              placeholder="شماره تماس"
              value={form.phoneNumber}
              onChange={(e) =>
                setForm({ ...form, phoneNumber: e.target.value })
              }
              className="w-full border p-2 rounded mb-3"
            />

            <label className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) =>
                  setForm({ ...form, isActive: e.target.checked })
                }
              />
              فعال
            </label>

            {/* Price List */}
            <div className="border rounded-lg p-4 mb-4 bg-gray-50">
              <div className="flex items-center gap-2 mb-3">
                <FaMoneyBillWave className="text-green-700" />
                <h4 className="font-semibold text-gray-800">
                  لیست قیمت (اندازه‌ها)
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {form.priceList.map((item, index) => (
                  <div
                    key={item.size}
                    className="flex items-center justify-between gap-2 border rounded p-2 bg-white"
                  >
                    <span className="text-sm text-gray-700 whitespace-nowrap">
                      {item.size}
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={item.price}
                      onChange={(e) =>
                        handlePriceChange(index, e.target.value)
                      }
                      className="w-24 border p-1 rounded text-center"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border rounded"
              >
                لغو
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-cyan-800 text-white rounded flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? "در حال ذخیره..." : "ذخیره"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Price List Modal (Edit only) */}
      {isPriceModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handlePriceSubmit}
            className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <FaMoneyBillWave className="text-green-700" />
              ویرایش لیست قیمت مشتری #{priceEditingId}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {form.priceList.map((item, index) => (
                <div
                  key={item.size}
                  className="flex items-center justify-between gap-2 border rounded p-2 bg-gray-50"
                >
                  <span className="text-sm text-gray-700 whitespace-nowrap">
                    {item.size}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={item.price}
                    onChange={(e) =>
                      handlePriceChange(index, e.target.value)
                    }
                    className="w-24 border p-1 rounded text-center bg-white"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={resetPriceForm}
                className="px-4 py-2 border rounded"
              >
                لغو
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-green-700 text-white rounded flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? "در حال ذخیره..." : "ذخیره"}
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedCustomer && (
        <div className="mt-8">
          <RemainOrderItems customer={selectedCustomer} />
        </div>
      )}
    </div>
  );
};

export default Customers;