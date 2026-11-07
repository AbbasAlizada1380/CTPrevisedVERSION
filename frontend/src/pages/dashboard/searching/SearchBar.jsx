// SearchBar.jsx
import React, { useState, forwardRef, useImperativeHandle } from "react";
import { Search } from "lucide-react";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const SearchBar = forwardRef(({ onResults, placeholder, customerId }, ref) => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // SearchBar.jsx - Update the handleSearch function
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) {
      onResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('q', query.trim());

      if (customerId) {
        params.append('customerId', customerId);
      }

      const res = await axios.get(`${BASE_URL}/orderItems/search?${params.toString()}`);

      console.log("🔍 Search response:", res.data); // Debug log

      // Check for success flag
      if (res.data && res.data.success !== false && res.data.items) {
        onResults(res.data.items, res.data.count);
      } else {
        onResults([]);
        setError(res.data?.message || "No results found");
      }
    } catch (error) {
      console.error("❌ Error searching order items:", error);
      console.error("❌ Error details:", {
        status: error.response?.status,
        data: error.response?.data
      });

      // Show user-friendly error message
      if (error.response?.status === 404) {
        setError("Search endpoint not found. Please check backend routes.");
      } else if (error.response?.status === 400) {
        setError(error.response?.data?.message || "Invalid search query");
      } else {
        setError("خطا در اتصال به سرور. لطفاً دوباره تلاش کنید.");
      }
      onResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch(e);
    }
  };

  // Expose functions to parent via ref
  useImperativeHandle(ref, () => ({
    reset: () => {
      setQuery("");
      setError(null);
      onResults([]);
    },
    search: (searchQuery) => {
      setQuery(searchQuery);
      // Trigger search automatically after setting query
      setTimeout(() => {
        const fakeEvent = { preventDefault: () => { } };
        handleSearch(fakeEvent);
      }, 0);
    }
  }));

  const defaultPlaceholder = customerId
    ? "جستجو بر اساس شماره بیل یا نام فایل..."
    : "جستجو بر اساس شماره بیل، نام فایل یا مشتری...";

  return (
    <div className="w-full">
      <form
        onSubmit={handleSearch}
        className="flex items-center gap-3 w-full max-w-[500px] bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 shadow-sm focus-within:ring-1 focus-within:ring-cyan-800 transition"
      >
        {loading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cyan-800"></div>
        ) : (
          <Search className="text-gray-400" size={20} />
        )}
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setError(null);
          }}
          onKeyPress={handleKeyPress}
          placeholder={placeholder || defaultPlaceholder}
          className="flex-1 outline-none text-gray-700 placeholder-gray-400 bg-transparent text-right"
          dir="rtl" // Right-to-left for Persian/Arabic
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-cyan-800 text-white rounded-md px-4 py-2 hover:bg-cyan-900 disabled:bg-cyan-600 transition min-w-[80px]"
        >
          {loading ? "..." : "جستجو"}
        </button>
      </form>

      {error && (
        <div className="mt-2 text-red-600 text-sm bg-red-50 p-2 rounded-md border border-red-200">
          {error}
        </div>
      )}


    </div>
  );
});

// Add display name for better debugging
SearchBar.displayName = 'SearchBar';

export default SearchBar;