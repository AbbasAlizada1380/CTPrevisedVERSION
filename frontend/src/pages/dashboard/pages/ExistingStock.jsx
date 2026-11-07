import { useEffect, useState } from "react";
import sizes from "../services/Size.js"; // Optional if you want size labels
import Pagination from "../pagination/Pagination"; // Import the Pagination component

const BASE_URL = import.meta.env.VITE_BASE_URL;
const EXIST_API_URL = `${BASE_URL}/stock/exist`;

const ExistingStock = () => {
  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState({
    totalItems: 0,
    totalStock: 0,
    lowStockCount: 0
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [perPage, setPerPage] = useState(10);

  // Fetch existing stock from API
  const fetchStock = async (page = 1, search = "") => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: perPage.toString()
      });

      if (search) {
        params.append("size", search);
      }

      const response = await fetch(`${EXIST_API_URL}?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Handle both response formats
      if (result.data) {
        // New format: { success: true, count: 1, data: [...] }
        setStockItems(result.data);
        setTotalItems(result.count || 0);
        setSummary({
          totalItems: result.count || 0,
          totalStock: result.summary?.totalStock || 0,
          lowStockCount: result.summary?.lowStockCount || 0
        });
        setTotalPages(result.pagination?.totalPages || 1);
      } else if (result.exists) {
        // Alternative format: { exists: [...], summary: {...}, pagination: {...} }
        setStockItems(result.exists);
        setTotalItems(result.pagination?.totalItems || 0);
        setSummary(result.summary || {});
        setTotalPages(result.pagination?.totalPages || 1);
      } else {
        // Direct array format
        setStockItems(result);
        setTotalItems(result.length);
        setSummary({
          totalItems: result.length,
          totalStock: result.reduce((sum, item) => sum + parseFloat(item.quantity || 0), 0),
          lowStockCount: 0
        });
        setTotalPages(1);
      }

      setCurrentPage(page);
    } catch (error) {
      console.error("Error fetching existing stock:", error);
      setError("خطا در دریافت اطلاعات موجودی");
      setStockItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stock on component mount and when page/search changes
  useEffect(() => {
    fetchStock(currentPage, searchTerm);
  }, [currentPage, searchTerm]);


  // Handle page change
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // Handle search reset
  const handleResetSearch = () => {
    setSearchTerm("");
    setCurrentPage(1);
    fetchStock(1, "");
  };

  // Get size label if available
  const getSizeLabel = (size) => {
    if (!sizes || !Array.isArray(sizes)) return size;

    const sizeObj = sizes.find(s => s.value === size || s.label === size);
    return sizeObj ? sizeObj.label : size;
  };

  // Get stock status color
  const getStockStatus = (quantity) => {
    const qty = parseFloat(quantity);
    if (qty === 0) return "bg-red-100 text-red-800";
    if (qty < 10) return "bg-yellow-100 text-yellow-800";
    if (qty < 20) return "bg-blue-100 text-blue-800";
    return "bg-green-100 text-green-800";
  };

  // Get stock status text
  const getStockStatusText = (quantity) => {
    const qty = parseFloat(quantity);
    if (qty === 0) return "اتمام موجودی";
    if (qty < 5) return "کمبود شدید";
    if (qty < 10) return "کمبود";
    if (qty < 20) return "متوسط";
    return "کافی";
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-md">
        <h2 className="text-xl font-bold text-cyan-800 mb-4">موجودی فعلی</h2>
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">
            در حال بارگذاری اطلاعات موجودی...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold text-cyan-800 mb-6">موجودی فعلی انبار</h2>
      {/* Page Info */}
      <div className="mb-4 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          نمایش {(currentPage - 1) * perPage + 1} تا {Math.min(currentPage * perPage, totalItems)} از {totalItems} مورد
        </div>
        {searchTerm && (
          <div className="text-sm text-cyan-600">
            نتایج جستجو برای: "{searchTerm}"
          </div>
        )}
      </div>

      {stockItems.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 text-lg">هیچ موجودی ثبت نشده است</p>
          {searchTerm && (
            <p className="text-gray-400 mt-2">
              نتیجه‌ای برای "{searchTerm}" یافت نشد
            </p>
          )}
        </div>
      ) : (
        <>
          {/* Stock Table */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-center">
              <thead className="bg-cyan-50 text-cyan-800">
                <tr>
                  <th className="p-3 border-b font-semibold">#</th>
                  <th className="p-3 border-b font-semibold">اندازه</th>
                  <th className="p-3 border-b font-semibold">تعداد (پلیت)</th>
                  <th className="p-3 border-b font-semibold">وضعیت</th>
                  <th className="p-3 border-b font-semibold">آخرین به‌روزرسانی</th>
                </tr>
              </thead>
              <tbody>
                {stockItems.map((item, index) => {
                  const rowNumber = (currentPage - 1) * perPage + index + 1;
                  const quantity = parseFloat(item.quantity || 0);
                  const statusClass = getStockStatus(item.quantity);
                  const statusText = getStockStatusText(item.quantity);
                  const platesCount = quantity * 50;

                  return (
                    <tr
                      key={item.id || index}
                      className="hover:bg-gray-50 border-b last:border-0 transition-colors"
                    >
                      <td className="p-3 text-gray-600">
                        {rowNumber}
                      </td>
                      <td className="p-3">
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm font-medium">
                          {getSizeLabel(item.size)}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-bold">
                          {quantity.toLocaleString('en-US')}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClass}`}>
                          {statusText}
                        </span>
                      </td>
                      <td className="p-3 text-gray-500 text-sm">
                        {item.updatedAt ?
                          new Date(item.updatedAt)
                            .toLocaleDateString('eng-en')
                            .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
                          : '—'
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
            <div className="pt-4 border-t border-gray-200">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
        </>
      )}
    </div>
  );
};

export default ExistingStock;