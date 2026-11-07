import React, { useState } from "react";

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const [pageInput, setPageInput] = useState("");

  const handlePageSubmit = (e) => {
    e.preventDefault();
    const page = parseInt(pageInput);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      onPageChange(page);
      setPageInput("");
    }
  };

  const isFirst = currentPage === 1;
  const isLast = currentPage === totalPages;

  return (
    <div className="flex flex-col md:flex-row items-center justify-center my-7 gap-x-5 text-sm">
      {/* Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={isFirst}
          className={`px-4 py-2 rounded-md font-medium transition cursor-pointer ${
            isFirst
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-cyan-800 text-white hover:bg-cyan-900"
          }`}
        >
          قبلی
        </button>

        <span className="px-3 text-gray-700">
          صفحه{" "}
          <span className="font-semibold text-cyan-800">{currentPage}</span> از{" "}
          <span className="font-semibold text-cyan-800">{totalPages}</span>
        </span>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={isLast}
          className={`px-4 py-2 rounded-md font-medium transition cursor-pointer ${
            isLast
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-cyan-800 text-white hover:bg-cyan-900"
          }`}
        >
          بعدی
        </button>
      </div>

      {/* Jump to Page */}
      <form onSubmit={handlePageSubmit} className="flex items-center  gap-x-2">
        <input
          type="number"
          min="1"
          max={totalPages}
          value={pageInput}
          onChange={(e) => setPageInput(e.target.value)}
          className="w-16 text-center border border-cyan-800 rounded-md px-1 py-2 focus:ring-1 focus:ring-cyan-800 focus:outline-none"
          placeholder="نمبر"
        />
        <button
          type="submit"
          className="px-3 py-2 bg-cyan-800 text-white rounded-md transition"
        >
          رفتن
        </button>
      </form>
    </div>
  );
};

export default Pagination;
