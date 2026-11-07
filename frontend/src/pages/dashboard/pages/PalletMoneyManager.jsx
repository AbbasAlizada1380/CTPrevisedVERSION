import { useEffect, useState } from "react";
import axios from "axios";
import {
  FaPlus,
  FaTrash,
  FaEdit,
  FaSave,
  FaTimes,
} from "react-icons/fa";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const PalletMoneyManager = () => {
  const [data, setData] = useState([]);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editAmount, setEditAmount] = useState("");

  /* ===========================
     Fetch Records
  =========================== */
  const fetchPalletMoney = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/palletmoney`);
      setData(res.data);
    } catch (err) {
      console.error(err);
      alert("خطا در دریافت اطلاعات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPalletMoney();
  }, []);

  /* ===========================
     Create
  =========================== */
  const handleCreate = async () => {
    if (!amount || amount <= 0) {
      return alert("مبلغ معتبر وارد کنید");
    }

    try {
      await axios.post(`${BASE_URL}/palletmoney/create`, { amount });
      setAmount("");
      fetchPalletMoney();
    } catch (err) {
      console.error(err);
      alert("خطا در ثبت مبلغ");
    }
  };

  /* ===========================
     Update
  =========================== */
  const handleUpdate = async (id) => {
    try {
      await axios.put(`${BASE_URL}/palletmoney/${id}`, {
        amount: editAmount,
      });
      setEditingId(null);
      setEditAmount("");
      fetchPalletMoney();
    } catch (err) {
      console.error(err);
      alert("خطا در ویرایش");
    }
  };

  /* ===========================
     Delete
  =========================== */
  const handleDelete = async (id) => {
    if (!window.confirm("آیا مطمئن هستید؟")) return;

    try {
      await axios.delete(`${BASE_URL}/palletmoney/${id}`);
      fetchPalletMoney();
    } catch (err) {
      console.error(err);
      alert("خطا در حذف");
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md border border-cyan-200">
      <h2 className="text-xl font-bold mb-6 text-cyan-700 flex items-center gap-2">
        💰 مدیریت پول پلت
      </h2>

      {/* Create */}
      <div className="flex gap-3 mb-6">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="مبلغ"
          className="border border-cyan-300 rounded-lg px-4 py-2 w-56 focus:ring-2 focus:ring-cyan-400 outline-none"
        />
        <button
          onClick={handleCreate}
          className="bg-cyan-600 hover:bg-cyan-700 text-white px-5 py-2 rounded-lg flex items-center gap-2 transition"
        >
          <FaPlus /> ثبت
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-cyan-600">در حال بارگذاری...</p>
      ) : (
        <table className="w-full text-sm border border-cyan-200 rounded-lg overflow-hidden">
          <thead className="bg-cyan-600 text-white">
            <tr>
              <th className="p-3">#</th>
              <th className="p-3">مبلغ</th>
              <th className="p-3">تاریخ</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr
                key={item.id}
                className="text-center even:bg-cyan-50 hover:bg-cyan-100 transition"
              >
                <td className="p-3">{index + 1}</td>

                <td className="p-3 font-semibold text-cyan-700">
                  {editingId === item.id ? (
                    <input
                      type="number"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      className="border border-cyan-300 rounded px-2 py-1 w-32 focus:ring-2 focus:ring-cyan-400 outline-none"
                    />
                  ) : (
                    Number(item.amount)
                  )}
                </td>

                <td className="p-3">
                  {new Date(item.createdAt).toLocaleDateString("en-GB")}
                </td>


              </tr>
            ))}

            {data.length === 0 && (
              <tr>
                <td
                  colSpan="4"
                  className="p-6 text-center text-gray-500"
                >
                  اطلاعاتی وجود ندارد
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default PalletMoneyManager;
