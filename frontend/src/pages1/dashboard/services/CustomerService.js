import axios from "axios";

const API_URL = import.meta.env.VITE_BASE_URL;

// دریافت لیست مشتریان
export const getCustomers = async ({
  page = 1,
  type = "",
  search = "",
  isStock,
} = {}) => {
  try {
    const response = await axios.get(`${API_URL}/api/customers`, {
      params: {
        page,
        type,
        search,
        isStock,
      },
    });

    return response.data;
    // { customers, pagination }
  } catch (error) {
    throw error;
  }
};

export const createCustomer = async (customerData) => {
  try {
    const response = await axios.post(`${API_URL}/api/customers`, customerData);
    return response.data;
  } catch (error) {
    throw error;
  }
};
// دریافت اطلاعات ولت (حساب) یک مشتری خاص
export const getCustomerWallet = async (customerId) => {
  try {
    const response = await axios.get(
      `${API_URL}/api/customers/${customerId}/wallet`,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ثبت پرداخت جدید (قسط/تسویه)
export const addCustomerPayment = async (paymentData) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/customers/payment`,
      paymentData,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// دریافت همه مشتریان بدون صفحه‌بندی
export const getAllCustomers = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/customers/all`);

    // برگرداندن کامل response.data
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching customers:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });

    throw error;
  }
};

// نسخه ایمن‌تر که همیشه آرایه برمی‌گرداند
export const getAllCustomersSafe = async () => {
  try {
    const data = await getAllCustomers();

    // تابع استخراج آرایه
    const extractArray = (data) => {
      if (Array.isArray(data)) return data;

      if (data && typeof data === "object") {
        const possibleKeys = ["customers", "data", "results", "items", "list"];

        for (const key of possibleKeys) {
          if (data[key] && Array.isArray(data[key])) {
            return data[key];
          }
        }

        // جستجوی تمام کلیدها
        for (const key in data) {
          if (Array.isArray(data[key])) {
            return data[key];
          }
        }
      }

      return [];
    };

    return extractArray(data);
  } catch (error) {
    console.error("Error in getAllCustomersSafe:", error);
    return [];
  }
};
// بروزرسانی مشتری
export const updateCustomer = async (customerId, customerData) => {
  try {
    const response = await axios.put(
      `${API_URL}/api/customers/${customerId}`,
      customerData
    );
    return response.data;
  } catch (error) {
    console.error("❌ Error updating customer:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
};

// حذف مشتری
export const deleteCustomer = async (customerId) => {
  try {
    const response = await axios.delete(
      `${API_URL}/api/customers/${customerId}`
    );
    return response.data;
  } catch (error) {
    console.error("❌ Error deleting customer:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
};
