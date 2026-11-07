// src/pages/EmployeesPage.jsx
import React, { useState, useEffect } from "react";
import {
  useEmployees,
  useCreateEmployee,
  useUpdateEmployee,
  useDeleteEmployee,
} from "../hooks/useEmployees";
import { formatMoney } from "../pages/dashboard/services/EmployeesService";
import { toast } from "react-hot-toast";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaFilter,
  FaTimes,
  FaCheck,
  FaExclamationTriangle,
  FaUserTie,
} from "react-icons/fa";
import { MdWork, MdPhone, MdPerson } from "react-icons/md";
import AnimatedModal from "../components/common/AnimatedModal";
import ConfirmationModal from "../components/common/ConfirmationModal";

const EmployeesPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    loanStatus: "all", // 'all', 'hasLoan', 'noLoan'
    position: "all",
  });
  const [availablePositions, setAvailablePositions] = useState([]);

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    position: "",
  });

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, error, refetch } = useEmployees({
    page,
    search: debouncedSearch,
  });

  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const deleteEmployee = useDeleteEmployee();

  // Extract unique positions from employees data
  useEffect(() => {
    if (data?.data) {
      const positions = [...new Set(data.data.map((emp) => emp.position))];
      setAvailablePositions(positions);
    }
  }, [data]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isEditMode) {
        await updateEmployee.mutateAsync({
          id: selectedEmployee.id,
          data: {
            fullName: formData.fullName,
            phone: formData.phone,
            position: formData.position,
          },
        });
        toast.success("کارمند با موفقیت ویرایش شد");
      } else {
        await createEmployee.mutateAsync({
          fullName: formData.fullName,
          phone: formData.phone,
          position: formData.position,
        });
        toast.success("کارمند با موفقیت ثبت شد");
      }

      setIsModalOpen(false);
      resetForm();
      refetch();
    } catch (error) {
      toast.error(error.response?.data?.error || "خطا در عملیات");
    }
  };

  const handleEdit = (employee) => {
    setSelectedEmployee(employee);
    setFormData({
      fullName: employee.fullName,
      phone: employee.phone,
      position: employee.position,
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (employee) => {
    if (employee.Wallet?.remainingBalance > 0) {
      toast.error("امکان حذف کارمند با قرضه فعال وجود ندارد");
      return;
    }
    setEmployeeToDelete(employee);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteEmployee.mutateAsync(employeeToDelete.id);
      toast.success("کارمند با موفقیت حذف شد");
      setShowDeleteConfirm(false);
      setEmployeeToDelete(null);
      refetch();
    } catch (error) {
      toast.error(error.response?.data?.error || "خطا در حذف کارمند");
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: "",
      phone: "",
      position: "",
    });
    setIsEditMode(false);
    setSelectedEmployee(null);
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      loanStatus: "all",
      position: "all",
    });
    setSearch("");
    setPage(1);
  };

  // Apply filters to employees
  const filteredEmployees = data?.data
    ? data.data.filter((employee) => {
        // Filter by loan status
        if (
          filters.loanStatus === "hasLoan" &&
          (!employee.Wallet || employee.Wallet.remainingBalance <= 0)
        ) {
          return false;
        }
        if (
          filters.loanStatus === "noLoan" &&
          employee.Wallet?.remainingBalance > 0
        ) {
          return false;
        }

        // Filter by position
        if (
          filters.position !== "all" &&
          employee.position !== filters.position
        ) {
          return false;
        }

        return true;
      })
    : [];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-700"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        خطا در بارگذاری اطلاعات: {error.message}
      </div>
    );
  }

  const employees = filteredEmployees;
  const pagination = data?.pagination || {};

  return (
    <div className="p-4" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">مدیریت کارمندان</h1>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-md flex items-center gap-2 transition"
        >
          <FaPlus />
          <span>ثبت کارمند جدید</span>
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 space-y-3">
        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            placeholder="جستجو بر اساس نام، شماره تماس یا وظیفه..."
            value={search}
            onChange={handleSearch}
            className="w-full p-3 pr-10 bg-gray-200 border-gray-300 rounded-md focus:ring-2 focus:ring-teal-700 focus:outline-none"
          />
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>

        {/* Filter Toggle Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-teal-700 hover:text-teal-800"
        >
          <FaFilter />
          <span>فیلترهای پیشرفته</span>
          {showFilters ? <FaTimes size={14} /> : <FaPlus size={14} />}
        </button>

        {/* Filter Options */}
        {showFilters && (
          <div className="bg-gray-100 p-4 rounded-md space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Loan Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  وضعیت قرضه
                </label>
                <select
                  value={filters.loanStatus}
                  onChange={(e) =>
                    handleFilterChange("loanStatus", e.target.value)
                  }
                  className="w-full p-2 border rounded-md focus:ring-1 focus:ring-teal-700"
                >
                  <option value="all">همه کارمندان</option>
                  <option value="hasLoan">دارای قرضه فعال</option>
                  <option value="noLoan">بدون قرضه</option>
                </select>
              </div>

              {/* Position Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  وظیفه
                </label>
                <select
                  value={filters.position}
                  onChange={(e) =>
                    handleFilterChange("position", e.target.value)
                  }
                  className="w-full p-2 border rounded-md focus:ring-1 focus:ring-teal-700"
                >
                  <option value="all">همه وظایف</option>
                  {availablePositions.map((pos, index) => (
                    <option key={index} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Clear Filters Button */}
            <button
              onClick={clearFilters}
              className="text-sm text-red-600 hover:text-red-800"
            >
              پاک کردن همه فیلترها
            </button>
          </div>
        )}
      </div>

      {/* Employee Table */}
      <div className="bg-white rounded-md shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-center text-sm">
            <thead className="bg-teal-800">
              <tr>
                <th className="px-6 py-3 text-gray-200 text-sm text-center uppercase tracking-wider">
                  #
                </th>
                <th className="px-6 py-3 text-gray-200 text-sm text-center uppercase tracking-wider">
                  <div className="flex items-center justify-center gap-1">
                    <MdPerson /> نام مکمل
                  </div>
                </th>
                <th className="px-6 py-3 text-gray-200 text-sm text-center uppercase tracking-wider">
                  <div className="flex items-center justify-center gap-1">
                    <MdPhone /> شماره تماس
                  </div>
                </th>
                <th className="px-6 py-3 text-gray-200 text-sm text-center uppercase tracking-wider">
                  <div className="flex items-center justify-center gap-1">
                    <MdWork /> وظیفه
                  </div>
                </th>
                <th className="px-6 py-3 text-gray-200 text-sm text-center uppercase tracking-wider">
                  وضعیت قرضه
                </th>
                <th className="px-6 py-3 text-gray-200 text-sm text-center uppercase tracking-wider">
                  باقی‌مانده
                </th>
                <th className="px-6 py-3 text-gray-200 text-sm text-center uppercase tracking-wider">
                  عملیات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employees.length > 0 ? (
                employees.map((employee, index) => (
                  <tr
                    key={employee.id}
                    className="hover:bg-gray-50 odd:bg-gray-100 transition"
                  >
                    <td className="px-6 py-3 whitespace-nowrap">{index + 1}</td>
                    <td className="px-6 py-3 whitespace-nowrap font-medium text-gray-900">
                      {employee.fullName}
                    </td>
                    <td className="px-6 py-3 text-sm whitespace-nowrap text-gray-600">
                      {employee.phone}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-gray-600">
                      {employee.position}
                    </td>
                    <td className="px-6 py-3 text-xs whitespace-nowrap">
                      {employee.Wallet?.remainingBalance > 0 ? (
                        <span className="px-2 py-1 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          <FaExclamationTriangle size={12} />
                          دارای قرضه فعال
                        </span>
                      ) : (
                        <span className="px-2 py-1 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          <FaCheck size={12} />
                          بدون قرضه
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          employee.Wallet?.remainingBalance > 0
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {formatMoney(employee.Wallet?.remainingBalance || 0)}{" "}
                        AFN
                      </span>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(employee)}
                        className="text-teal-600 hover:text-teal-900 ml-3 transition"
                        title="ویرایش"
                      >
                        <FaEdit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(employee)}
                        className="text-red-600 hover:text-red-900 transition"
                        title="حذف"
                      >
                        <FaTrash size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    <FaUserTie className="mx-auto text-4xl mb-2 text-gray-400" />
                    هیچ کارمندی با این مشخصات یافت نشد
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center items-center mt-6 gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className={`px-4 py-2 rounded-lg ${
              page === 1
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            قبلی
          </button>

          <div className="flex gap-1">
            {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
              let pageNum;
              if (pagination.pages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= pagination.pages - 2) {
                pageNum = pagination.pages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-10 h-10 rounded-lg ${
                    page === pageNum
                      ? "bg-teal-700 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setPage(Math.min(pagination.pages, page + 1))}
            disabled={page === pagination.pages}
            className={`px-4 py-2 rounded-lg ${
              page === pagination.pages
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            بعدی
          </button>
        </div>
      )}

      {/* Add/Edit Employee Modal */}
      <AnimatedModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
      >
        <div className="bg-white rounded-lg p-6 max-w-lg mx-auto" dir="rtl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              {isEditMode ? "ویرایش کارمند" : "ثبت کارمند جدید"}
            </h2>
            <button
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              &times;
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نام مکمل <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                required
                className="w-full p-3 bg-gray-200 border-gray-300 rounded-md focus:ring-1 focus:ring-teal-700 focus:border-transparent focus:outline-none"
                placeholder="مثال: محمد رحیمی"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                شماره تماس <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
                className="w-full p-3 bg-gray-200 border-gray-300 rounded-md focus:ring-1 focus:ring-teal-700 focus:border-transparent focus:outline-none"
                placeholder="مثال: ۰۷۹۱۲۳۴۵۶۷"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                وظیفه <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleInputChange}
                required
                className="w-full p-3 bg-gray-200 border-gray-300 rounded-md focus:ring-1 focus:ring-teal-700 focus:border-transparent focus:outline-none"
                placeholder="مثال: دیزاینر"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="submit"
                disabled={createEmployee.isLoading || updateEmployee.isLoading}
                className="flex-1 bg-teal-700 hover:bg-teal-800 text-white py-2 rounded-md transition disabled:bg-teal-300 disabled:cursor-not-allowed"
              >
                {createEmployee.isLoading || updateEmployee.isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {isEditMode ? "در حال ویرایش..." : "در حال ثبت..."}
                  </span>
                ) : isEditMode ? (
                  "ویرایش کارمند"
                ) : (
                  "ثبت کارمند"
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-md transition"
              >
                انصراف
              </button>
            </div>
          </form>
        </div>
      </AnimatedModal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setEmployeeToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="حذف کارمند"
        message={`آیا از حذف کارمند "${employeeToDelete?.fullName}" اطمینان دارید؟`}
        confirmText="حذف"
        cancelText="انصراف"
        type="danger"
      />
    </div>
  );
};

export default EmployeesPage;
