import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Pagination from '../pagination/Pagination';
import PalletMoneyManager from './PalletMoneyManager';

const CompanyStock = () => {
    const [companyStocks, setCompanyStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10
    });
    const [filters, setFilters] = useState({});

    // ---- Update mode state ----
    const [editingStock, setEditingStock] = useState(null); // the stock item being edited
    const [editForm, setEditForm] = useState({ quantity: '', size: '' });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [updateLoading, setUpdateLoading] = useState(false);
    const [updateError, setUpdateError] = useState('');

    const BASE_URL = import.meta.env.VITE_BASE_URL;

    // Fetch company stocks
    const fetchCompanyStocks = async (page = 1, limit = 10) => {
        setLoading(true);
        setError(null);

        try {
            const response = await axios.get(`${BASE_URL}/companystock`, {
                params: {
                    page,
                    limit,
                    ...filters
                }
            });

            if (response.data.success) {
                setCompanyStocks(response.data.data || []);
                setPagination(response.data.pagination || {
                    currentPage: 1,
                    totalPages: 1,
                    totalItems: 0,
                    itemsPerPage: 10
                });
                setFilters(response.data.filters || {});
            } else {
                throw new Error('Failed to fetch data');
            }
        } catch (err) {
            setError(err.message || 'An error occurred while fetching data');
            console.error('Error fetching company stocks:', err);
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchCompanyStocks();
    }, []);

    // Handle page change
    const handlePageChange = (newPage) => {
        fetchCompanyStocks(newPage, pagination.itemsPerPage);
    };

    // Handle limit change
    const handleLimitChange = (e) => {
        const newLimit = parseInt(e.target.value);
        fetchCompanyStocks(1, newLimit);
    };

    // Handle refresh
    const handleRefresh = () => {
        fetchCompanyStocks(pagination.currentPage, pagination.itemsPerPage);
    };

    // ---- Update handlers ----
    const openUpdateModal = (stock) => {
        setEditingStock(stock);
        setEditForm({
            quantity: stock.quantity,
            size: stock.size || ''
        });
        setUpdateError('');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingStock(null);
        setEditForm({ quantity: '', size: '' });
        setUpdateError('');
    };

    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        if (!editingStock) return;

        // Basic validation
        if (editForm.quantity === '' || isNaN(editForm.quantity) || Number(editForm.quantity) < 0) {
            setUpdateError('لطفاً مقدار معتبر وارد کنید (عدد مثبت)');
            return;
        }

        setUpdateLoading(true);
        setUpdateError('');

        try {
            const response = await axios.put(
                `${BASE_URL}/companystock/${editingStock.id}`,
                {
                    quantity: Number(editForm.quantity),
                    size: editForm.size // if you want to allow size change
                }
            );
            // Refresh the list
            await fetchCompanyStocks(pagination.currentPage, pagination.itemsPerPage);
            closeModal();
            // Optional: show success toast
            alert('موجودی با موفقیت به‌روزرسانی شد');

        } catch (err) {
            setUpdateError(err.message || 'خطا در ارتباط با سرور');
        } finally {
            setUpdateLoading(false);
        }
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('fa-IR');
    };

    // Render loading state (initial)
    if (loading && companyStocks.length === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-800"></div>
            </div>
        );
    }

    // Render error state (initial)
    if (error && companyStocks.length === 0) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <p className="text-red-700 mb-2">خطا در بارگذاری اطلاعات</p>
                <p className="text-red-600 text-sm mb-3">{error}</p>
                <button
                    onClick={handleRefresh}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                >
                    تلاش مجدد
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">موجودی شرکت</h1>
                    <p className="text-gray-600 mt-1">
                        مجموع اقلام: {pagination.totalItems}
                    </p>
                </div>
            </div>

            {/* Data Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                        <tr className="bg-gray-50">
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                #
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                سایز
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                مقدار
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                عملیات
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {companyStocks.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                                    هیچ داده‌ای یافت نشد
                                </td>
                            </tr>
                        ) : (
                            companyStocks.map((stock, index) => (
                                <tr
                                    key={stock.id}
                                    className="hover:bg-gray-50 transition-colors"
                                >
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {(pagination.currentPage - 1) * pagination.itemsPerPage + index + 1}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                        {stock.size || 'N/A'}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${parseInt(stock.quantity) <= 0
                                                ? 'bg-red-100 text-red-800'
                                                : 'bg-green-100 text-green-800'
                                            }`}>
                                            {stock.quantity}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                        <button
                                            onClick={() => openUpdateModal(stock)}
                                            className="text-blue-600 hover:text-blue-800 transition"
                                            title="ویرایش موجودی"
                                        >
                                            ✏️
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="mt-6">
                <Pagination
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    onPageChange={handlePageChange}
                />
            </div>

            {/* Loading overlay (for subsequent loads) */}
            {loading && companyStocks.length > 0 && (
                <div className="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center z-50">
                    <div className="bg-white p-4 rounded-lg shadow-lg flex items-center gap-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-800"></div>
                        <span className="text-gray-700">در حال بارگذاری...</span>
                    </div>
                </div>
            )}

            {/* ---- Update Modal ---- */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h2 className="text-xl font-bold mb-4">ویرایش موجودی</h2>
                        <form onSubmit={handleUpdateSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    سایز
                                </label>
                                <input
                                    type="text"
                                    value={editForm.size}
                                    onChange={(e) => setEditForm({ ...editForm, size: e.target.value })}
                                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    disabled={!editingStock?.sizeEditable} // optionally allow editing size
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    مقدار جدید
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={editForm.quantity}
                                    onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    required
                                />
                            </div>
                            {updateError && (
                                <div className="mb-4 text-sm text-red-600 bg-red-50 p-2 rounded">
                                    {updateError}
                                </div>
                            )}
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 border rounded-md hover:bg-gray-50 transition"
                                    disabled={updateLoading}
                                >
                                    انصراف
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-cyan-800 text-white rounded-md hover:bg-cyan-700 transition disabled:bg-gray-400"
                                    disabled={updateLoading}
                                >
                                    {updateLoading ? 'در حال ذخیره...' : 'ذخیره'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Other components */}
            <PalletMoneyManager />
        </div>
    );
};

export default CompanyStock;