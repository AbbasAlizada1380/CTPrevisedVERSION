// SearchBar.jsx
import React, { useState, forwardRef, useImperativeHandle } from "react";
import { Search } from "lucide-react";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const SearchBar = forwardRef(({ onResults }, ref) => {
  const [query, setQuery] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      const res = await axios.get(`${BASE_URL}/orders/search`, {
        params: { q: query },
      });
      onResults(res.data);
    } catch (error) {
      console.error("❌ Error searching orders:", error);
    }
  };

  // Expose a reset function to parent via ref
  useImperativeHandle(ref, () => ({
    reset: () => {
      setQuery("");
      onResults([]); // clear search results
    },
  }));
  return (
    <form
      onSubmit={handleSearch}
      className="flex items-center gap-3  w-[400px]  bg-gray-50 border border-gray-300 rounded-md px-2 py-2 shadow-sm focus-within:ring-1 focus-within:ring-cyan-800 transition"
    >
      
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="جستجو بر اساس نام مشتری یا شماره بیل..."
        className="flex-1 outline-none text-gray-700 placeholder-gray-400"
      />
      <button
        type="submit"
        className="bg-gray-800 text-white text-xs rounded-md px-4 py-2  transition"
      >
        جستجو
      </button>
    </form>
  );
});

export default SearchBar;
