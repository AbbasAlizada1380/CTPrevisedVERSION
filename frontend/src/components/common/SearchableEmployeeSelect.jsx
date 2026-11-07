import React, { useState, useRef, useEffect } from "react";
import { FaSearch, FaTimes } from "react-icons/fa";

const SearchableEmployeeSelect = ({
  employees = [],
  loanForm,
  setLoanForm,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);

  // وقتی کارمند انتخاب شد → نمایش اسم او
  useEffect(() => {
    const selectedEmployee = employees.find(
      (e) => e.id === loanForm?.employeeId, // Added optional chaining
    );

    if (selectedEmployee) {
      setSearch(selectedEmployee.fullName);
    } else {
      // اگر هیچ کارمندی انتخاب نشده بود، سرچ خالی باشد
      setSearch("");
    }
  }, [loanForm?.employeeId, employees]); // Added optional chaining

  // بستن dropdown وقتی بیرون کلیک شد
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // فیلتر کردن کارمندان بر اساس جستجو
  const filteredEmployees = employees?.filter(
    (emp) =>
      emp.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      emp.phone?.includes(search) ||
      emp.position?.toLowerCase().includes(search.toLowerCase()), // Added position search
  );

  const selectEmployee = (emp) => {
    setLoanForm({
      ...loanForm,
      employeeId: emp.id,
    });

    setSearch(emp.fullName);
    setOpen(false);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);

    // اگر کاربر شروع به تایپ کرد → انتخاب قبلی پاک شود
    if (loanForm?.employeeId) {
      // Check if there is a selected employee
      setLoanForm({
        ...loanForm,
        employeeId: null,
      });
    }

    setOpen(true);
  };

  const clearSearch = (e) => {
    e.stopPropagation(); // Prevent opening dropdown
    setSearch("");
    setLoanForm({
      ...loanForm,
      employeeId: null,
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        انتخاب کارمند <span className="text-red-500">*</span>
      </label>

      <div
        onClick={() => setOpen(true)}
        className="w-full p-3 bg-gray-200 border-gray-300 flex items-center rounded-md focus:ring-1 focus:ring-teal-700 focus:border-transparent focus:outline-none"
      >
        <input
          type="text"
          value={search}
          onChange={handleSearchChange}
          placeholder="جستجوی کارمند..."
          className="w-full outline-none"
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
        />

        {search && (
          <FaTimes
            className="text-gray-400 cursor-pointer hover:text-red-500 mx-2"
            onClick={clearSearch}
          />
        )}

        <FaSearch className="text-gray-400" />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute w-full bg-gray-100 border border-gray-300 rounded-md mt-1 shadow-lg z-50">
          <div className="max-h-60 overflow-y-auto">
            {filteredEmployees?.length > 0 ? (
              filteredEmployees.map((emp) => (
                <div
                  key={emp.id}
                  onClick={() => selectEmployee(emp)}
                  className={`p-3 hover:bg-teal-700 hover:text-white  flex justify-between items-center cursor-pointer transition ${
                    loanForm?.employeeId === emp.id ? "bg-blue-100" : ""
                  }`}
                >
                  <div className="font-medium">{emp.fullName}</div>
                  <div className="text-sm ">
                    {emp.position}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                نتیجه‌ای یافت نشد
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableEmployeeSelect;
