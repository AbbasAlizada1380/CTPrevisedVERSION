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

  // Helper function to generate page numbers to display
  const getPageNumbers = () => {
    const delta = 2; // Number of pages to show on each side of current page
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        range.push(i);
      }
    }

    range.forEach((i) => {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push("...");
        }
      }
      rangeWithDots.push(i);
      l = i;
    });

    return rangeWithDots;
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-center my-5 gap-x-5 text-sm">
      {/* Buttons */}
      <button
        onClick={() => onPageChange(1)}
        disabled={isFirst}
        className={`px-2 py-2 rounded-md text-xs font-medium transition cursor-pointer ${
          isFirst
            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
            : "bg-gray-800 text-white hover:bg-gray-700"
        }`}
        title="صفحه اول"
      >
        اولین صفحه
      </button>
      <div className="flex items-center gap-2">
        {/* First Page Button */}

        {/* Previous Button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={isFirst}
          className={`px-2 py-2 rounded-md text-xs font-medium transition cursor-pointer ${
            isFirst
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-gray-800 text-white hover:bg-gray-700"
          }`}
        >
          قبلی
        </button>

        {/* Page Numbers */}
        <div className="hidden md:flex items-center gap-1 mx-2">
          {getPageNumbers().map((page, index) => (
            <button
              key={index}
              onClick={() =>
                typeof page === "number" ? onPageChange(page) : null
              }
              disabled={page === "..."}
              className={`w-8 h-8 rounded-md text-sm font-medium transition cursor-pointer ${
                page === currentPage
                  ? "bg-cyan-700 text-white"
                  : page === "..."
                    ? "bg-transparent text-gray-600 cursor-default"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {page}
            </button>
          ))}
        </div>

        <span className="px-3 text-gray-700 md:hidden">
          صفحه{" "}
          <span className="font-semibold text-cyan-800">{currentPage}</span> از{" "}
          <span className="font-semibold text-cyan-800">{totalPages}</span>
        </span>

        {/* Next Button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={isLast}
          className={`px-2 py-2 text-xs rounded-md font-medium transition cursor-pointer ${
            isLast
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-gray-800 text-white hover:bg-gray-700"
          }`}
        >
          بعدی
        </button>

        {/* Last Page Button */}
      </div>

      {/* Jump to Page */}
      <form
        onSubmit={handlePageSubmit}
        className="flex items-center gap-x-2 mt-3 md:mt-0"
      >
        <input
          type="number"
          min="1"
          max={totalPages}
          value={pageInput}
          onChange={(e) => setPageInput(e.target.value)}
          className="w-14 text-center border border-cyan-800 rounded-md px-1 py-1.5 focus:ring-1 focus:ring-cyan-800 focus:outline-none"
          placeholder="نمبر"
        />
        <button
          type="submit"
          className="px-2 py-2 text-xs bg-gray-800 text-white rounded-md transition hover:bg-gray-700"
        >
          رفتن
        </button>
      </form>
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={isLast}
        className={`px-2 py-2 rounded-md text-xs font-medium transition cursor-pointer ${
          isLast
            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
            : "bg-gray-800 text-white hover:bg-gray-700"
        }`}
        title="صفحه آخر"
      >
        آخرین صفحه
      </button>
    </div>
  );
};

export default Pagination;
