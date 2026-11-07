import axios from "axios";
import Swal from "sweetalert2";

const BASE_URL = import.meta.env.VITE_BASE_URL;

// ✅ Helper function for showing Swal messages
const showAlert = (title, text, icon = "success") => {
  Swal.fire({
    title,
    text,
    icon,
    confirmButtonText: "تایید",
    timer: icon === "success" ? 1500 : null,
  });
};

// ✅ Get all orders with pagination
export const getOrders = async (page = 1, limit = 20) => {
  try {
    const res = await axios.get(
      `${BASE_URL}/orders?page=${page}&limit=${limit}`
    );
    return res.data;
  } catch (error) {
    console.error("❌ Error fetching orders:", error);
    showAlert("خطا", "بارگذاری بیل‌ها موفقیت‌آمیز نبود", "error");
    throw error;
  }
};

// ✅ Get a single order by ID
export const getOrderById = async (id) => {
  try {
    const res = await axios.get(`${BASE_URL}/orders/${id}`);
    return res.data;
  } catch (error) {
    console.error("❌ Error fetching order:", error);
    showAlert("خطا", "بیل موردنظر یافت نشد", "error");
    throw error;
  }
};

// ✅ Create a new order
export const createOrder = async (orderData) => {
  try {
    if (!orderData.customer.name || orderData.customer.name.trim() === "") {
      showAlert("خطا", "نام مشتری نمی‌تواند خالی باشد", "error");
      return;
    }
    const res = await axios.post(`${BASE_URL}/orders`, orderData);
    return res.data;
  } catch (error) {
    console.error(error);
    showAlert("خطا", "خطا در ثبت بیل 😢", "error");
    throw error;
  }
};

// ✅ Update an existing order
export const updateOrder = async (id, orderData) => {
  try {
    const res = await axios.put(`${BASE_URL}/orders/${id}`, orderData);
    showAlert("موفق", "بیل با موفقیت ویرایش شد ✏️", "success");
    return res.data;
  } catch (error) {
    console.error(error);
    showAlert("خطا", "خطا در ویرایش بیل 😢", "error");
    throw error;
  }
};

// ✅ Delete an order

export const deleteOrder = async (id) => {
  try {
    // 🟡 مرحله تأیید قبل از حذف
    const result = await Swal.fire({
      title: "آیا مطمئن هستید؟",
      text: `آیا می‌خواهید  بیل ${id}را حذف کنید؟ این عمل قابل بازگشت نیست!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "بله، حذف شود",
      cancelButtonText: "خیر، لغو",
      reverseButtons: true,
    });

    if (!result.isConfirmed) {
      Swal.fire({
        icon: "info",
        title: "حذف لغو شد",
        text: "عملیات حذف انجام نگردید.",
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }

    // ✅ اگر کاربر تأیید کرد، حذف را انجام بده
    await axios.delete(`${BASE_URL}/orders/${id}`);

    Swal.fire({
      icon: "success",
      title: "حذف موفقانه انجام شد",
      text: "بیل با موفقیت حذف گردید 🗑️",
      timer: 2000,
      showConfirmButton: false,
    });
  } catch (error) {
    console.error("Error deleting order:", error);

    Swal.fire({
      icon: "error",
      title: "خطا در حذف",
      text: "در هنگام حذف بیل خطایی رخ داد. لطفاً دوباره تلاش کنید 😢",
    });

    throw error;
  }
};

export const toggleDelivery = async (orderId, currentStatus) => {
  try {
    const res = await axios.patch(`${BASE_URL}/orders/${orderId}`, {
      isDelivered: !currentStatus,
    });

    Swal.fire({
      title: "موفق",
      text: `وضعیت تحویل بیل نمبر ${orderId} تغییر کرد ✅`,
      icon: "success",
      timer: 1000, 
      showConfirmButton: false,
    });

    return res.data;
  } catch (error) {
    console.error(error);

    Swal.fire({
      title: "خطا",
      text: "تغییر وضعیت تحویل انجام نشد 😢",
      icon: "error",
      timer: 1000,
      showConfirmButton: false,
    });
  }
};



export const payRemaining = async (order) => {
  try {

    // ✅ اگر کاربر تأیید کرد، پرداخت را انجام بده
    const updatedOrder = await axios.patch(`${BASE_URL}/orders/${order.id}`, {
      recip: order.recip + order.remained,
      remained: 0,
    });

    // ✅ پیام موفقیت
    Swal.fire({
      icon: "success",
      title: "پرداخت موفقانه انجام شد",
      text: "باقی‌مانده پول این سفارش پرداخت گردید.",
      timer: 2000,
      showConfirmButton: false,
    });

    return updatedOrder.data;
  } catch (err) {
    console.error("Error paying remaining:", err);

    // ❌ پیام خطا
    Swal.fire({
      icon: "error",
      title: "پرداخت ناموفق بود",
      text: "در هنگام پرداخت خطایی رخ داد. لطفاً دوباره تلاش کنید.",
    });

    throw err;
  }
};
export const getOrdersByDateRange = async (
  startDate,
  endDate,
  page = 1,
  limit = 1000
) => {
  try {
    const response = await axios.get(`${BASE_URL}/orders/download`, {
      params: {
        startDate,
        endDate,
        page,
        limit,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching orders by date range:", error);
    throw error;
  }
};

export const exportOrdersToCSV = async (startDate, endDate) => {
  try {
    const response = await axios.get(`${BASE_URL}/orders/download`, {
      params: {
        startDate,
        endDate,
      },
      responseType: "blob", // Important for file download
    });
    return response;
  } catch (error) {
    console.error("Error exporting orders:", error);
    throw error;
  }
};