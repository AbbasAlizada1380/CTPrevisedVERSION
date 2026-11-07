import { useEffect, useState } from "react";
import axios from "axios";
import ExpenseTable from "./ExpenseTable";
import { useSelector } from "react-redux";

const BASE_URL = import.meta.env.VITE_BASE_URL;
const limit = 20;

const ExpenseManager = () => {
    const [expenses, setExpenses] = useState([]);
    const { currentUser } = useSelector((state) => state.user);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({
        purpose: "",
        by: "",
        amount: "",
        description: "",
    });

    /* ======================
       Fetch Expenses
    ====================== */
    const fetchExpenses = async (page = 1) => {
        try {
            setLoading(true);
            const res = await axios.get(`${BASE_URL}/expense?page=${page}&limit=${limit}`);
            setExpenses(res.data.expenses);
            setCurrentPage(res.data.pagination.currentPage);
            setTotalPages(res.data.pagination.totalPages);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExpenses(currentPage);
    }, [currentPage]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (submitting) return;

        try {
            setSubmitting(true);

            if (editingId) {
                await axios.put(`${BASE_URL}/expense/${editingId}`, form);
            } else {
                await axios.post(`${BASE_URL}/expense`, form);
            }

            resetForm();
            fetchExpenses(currentPage);
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "Error saving expense");
        } finally {
            setSubmitting(false);
        }
    };

    /* ======================
       Edit Expense
    ====================== */
    const handleEdit = (expense) => {
        setEditingId(expense.id);
        setForm({
            purpose: expense.purpose,
            by: expense.by,
            amount: expense.amount,
            description: expense.description,
        });
    };

    /* ======================
       Delete Expense
    ====================== */
    const handleDelete = async (id) => {
        if (!window.confirm("آیا مطمئن هستید؟")) return;

        try {
            await axios.delete(`${BASE_URL}/expense/${id}`);
            fetchExpenses(currentPage);
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "Error deleting expense");
        }
    };

    /* ======================
       Reset Form
    ====================== */
    const resetForm = () => {
        setForm({ purpose: "", by: "", amount: "", description: "" });
        setEditingId(null);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6 space-y-8">
            {/* Header */}
            <div className="text-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">مدیریت هزینه‌ها</h1>
                <p className="text-gray-600">ثبت و مدیریت هزینه‌های سازمانی</p>

                {editingId && (
                    <div className="mt-4 p-4 bg-yellow-100 border border-yellow-400 rounded-xl max-w-md mx-auto">
                        <div className="flex items-center justify-center gap-2 text-yellow-800">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                            <span className="font-semibold">حالت ویرایش – هزینه #{editingId}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Form Section */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                {/* Form Header */}
                <div className="bg-gradient-to-r from-cyan-800 to-cyan-600 text-white p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">
                                {editingId ? "ویرایش هزینه" : "افزودن هزینه جدید"}
                            </h2>
                            <p className="text-sm text-white/80">
                                {editingId ? "ویرایش اطلاعات هزینه" : "ثبت اطلاعات هزینه جدید"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form Content */}
                <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Purpose Field */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <span className="text-red-500">*</span> هدف هزینه
                                </label>
                                <input
                                    required
                                    placeholder="مثال: خرید تجهیزات اداری"
                                    value={form.purpose}
                                    onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                                />
                            </div>

                            {/* By Field */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <span className="text-red-500">*</span> پرداخت کننده
                                </label>
                                <input
                                    required
                                    placeholder="مثال: مدیریت مالی"
                                    value={form.by}
                                    onChange={(e) => setForm({ ...form, by: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                                />
                            </div>
                        </div>

                        {/* Amount Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <span className="text-red-500">*</span> مبلغ (افغانی)
                            </label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                    ؋
                                </div>
                                <input
                                    required
                                    type="number"
                                    min="0"
                                    value={form.amount}
                                    onChange={(e) =>
                                        setForm({ ...form, amount: parseInt(e.target.value || 0, 10) })
                                    }
                                    className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                                />

                            </div>
                        </div>

                        {/* Description Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                توضیحات
                            </label>
                            <textarea
                                placeholder="توضیحات بیشتر درباره هزینه (اختیاری)"
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                rows={3}
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition resize-none"
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                            {editingId && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                                >
                                    لغو ویرایش
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={submitting}
                                className={`px-6 py-3 rounded-lg font-medium shadow-md transition
        ${submitting
                                        ? "bg-gray-400 cursor-not-allowed"
                                        : "bg-gradient-to-r from-cyan-800 to-cyan-600 hover:from-cyan-900 hover:to-cyan-700 text-white"
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    {submitting ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                                <circle
                                                    className="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                    fill="none"
                                                />
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                                />
                                            </svg>
                                            <span>در حال ذخیره...</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path
                                                    fillRule="evenodd"
                                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                            <span>{editingId ? "ذخیره تغییرات" : "ثبت هزینه"}</span>
                                        </>
                                    )}
                                </div>
                            </button>

                        </div>
                    </form>
                </div>
            </div>



            {/* Expense Table */}
            <ExpenseTable
                expenses={expenses}
                loading={loading}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />
        </div>
    );
};

export default ExpenseManager;
