import axios from "axios";

const API_URL = import.meta.env.VITE_BASE_URL;

// ==================== Employee APIs ====================

// دریافت لیست کارمندان با صفحه‌بندی
export const getEmployees = async ({
  page = 1,
  limit = 10,
  search = "",
} = {}) => {
  try {
    const response = await axios.get(`${API_URL}/employees`, {
      params: {
        page,
        limit,
        search,
      },
    });
    return response.data; // { success: true, data: employees, pagination }
  } catch (error) {
    console.error("❌ Error fetching employees:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
};

// دریافت همه کارمندان بدون صفحه‌بندی (برای dropdownها)
export const getAllEmployees = async () => {
  try {
    const response = await axios.get(`${API_URL}/employees/all`);
    return response.data; // { success: true, data: employees }
  } catch (error) {
    console.error("❌ Error fetching all employees:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
};

// نسخه ایمن‌تر که همیشه آرایه برمی‌گرداند
export const getAllEmployeesSafe = async () => {
  try {
    const data = await getAllEmployees();

    // تابع استخراج آرایه
    const extractArray = (data) => {
      // اگر خود data آرایه باشد
      if (Array.isArray(data)) return data;

      // اگر data ساختار { success, data } داشته باشد
      if (data && data.success && Array.isArray(data.data)) {
        return data.data;
      }

      // اگر data یک آبجکت باشد
      if (data && typeof data === "object") {
        const possibleKeys = ["employees", "data", "results", "items", "list"];

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
    console.error("Error in getAllEmployeesSafe:", error);
    return [];
  }
};

// دریافت اطلاعات یک کارمند
export const getEmployeeById = async (employeeId) => {
  try {
    const response = await axios.get(`${API_URL}/employees/${employeeId}`);
    return response.data; // { success: true, data: employee }
  } catch (error) {
    console.error("❌ Error fetching employee:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
};

// ثبت کارمند جدید
export const createEmployee = async (employeeData) => {
  try {
    const response = await axios.post(`${API_URL}/employees`, employeeData);
    return response.data; // { success: true, data: employee }
  } catch (error) {
    console.error("❌ Error creating employee:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
};

// بروزرسانی کارمند
export const updateEmployee = async (employeeId, employeeData) => {
  try {
    const response = await axios.put(
      `${API_URL}/employees/${employeeId}`,
      employeeData,
    );
    return response.data; // { success: true, data: employee }
  } catch (error) {
    console.error("❌ Error updating employee:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
};

// حذف کارمند
export const deleteEmployee = async (employeeId) => {
  try {
    const response = await axios.delete(
      `${API_URL}/employees/${employeeId}`,
    );
    return response.data; // { success: true, message: "..." }
  } catch (error) {
    console.error("❌ Error deleting employee:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
};

// ==================== Wallet APIs ====================

// دریافت والت یک کارمند
export const getEmployeeWallet = async (employeeId) => {
  try {
    const response = await axios.get(
      `${API_URL}/wallets/employee/${employeeId}`,
    );
    return response.data; // { success: true, data: wallet }
  } catch (error) {
    console.error("❌ Error fetching wallet:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
};

// دریافت همه والت‌ها
export const getAllWallets = async () => {
  try {
    const response = await axios.get(`${API_URL}/wallets`);
    return response.data; // { success: true, data: wallets, summary }
  } catch (error) {
    console.error("❌ Error fetching wallets:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
};

// ریست والت (فقط ادمین)
export const resetWallet = async (walletId) => {
  try {
    const response = await axios.put(
      `${API_URL}/wallets/${walletId}/reset`,
    );
    return response.data; // { success: true, message: "...", data: wallet }
  } catch (error) {
    console.error("❌ Error resetting wallet:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
};

// ==================== Loan APIs ====================

// دریافت لیست قرضه‌های فعال
export const getActiveLoans = async () => {
  try {
    const response = await axios.get(`${API_URL}/loans/active`);
    return response.data; // { success: true, data: { loans, summary } }
  } catch (error) {
    console.error("❌ Error fetching active loans:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
};

// دریافت لیست قرضه‌های بسته شده
export const getClosedLoans = async ({ page = 1, limit = 10 } = {}) => {
  try {
    const response = await axios.get(`${API_URL}/loans/closed`, {
      params: { page, limit },
    });
    return response.data; // { success: true, data: loans, pagination }
  } catch (error) {
    console.error("❌ Error fetching closed loans:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
};

// دریافت اطلاعات یک قرضه
export const getLoanById = async (loanId) => {
  try {
    const response = await axios.get(`${API_URL}/loans/${loanId}`);
    return response.data; // { success: true, data: loan }
  } catch (error) {
    console.error("❌ Error fetching loan:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
};

// ثبت قرضه جدید
export const createLoan = async (loanData) => {
  try {
    const response = await axios.post(`${API_URL}/loans`, loanData);
    return response.data; // { success: true, data: loan }
  } catch (error) {
    console.error("❌ Error creating loan:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
};

// بستن قرضه به صورت دستی
export const closeLoan = async (loanId) => {
  try {
    const response = await axios.put(`${API_URL}/loans/${loanId}/close`);
    return response.data; // { success: true, message: "...", data: loan }
  } catch (error) {
    console.error("❌ Error closing loan:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
};

// ==================== Payment APIs ====================

// ثبت پرداخت جدید
export const makePayment = async (paymentData) => {
  try {
    const response = await axios.post(`${API_URL}/payments`, paymentData);
    return response.data; // { success: true, message: "...", data: { payment, loan, wallet } }
  } catch (error) {
    console.error("❌ Error making payment:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
};

// دریافت پرداخت‌های یک قرضه
export const getLoanPayments = async (loanId) => {
  try {
    const response = await axios.get(`${API_URL}/payments/loan/${loanId}`);
    return response.data; // { success: true, data: { payments, summary } }
  } catch (error) {
    console.error("❌ Error fetching loan payments:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
};

// دریافت اطلاعات یک پرداخت
export const getPaymentById = async (paymentId) => {
  try {
    const response = await axios.get(`${API_URL}/payments/${paymentId}`);
    return response.data; // { success: true, data: payment }
  } catch (error) {
    console.error("❌ Error fetching payment:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
};

// بروزرسانی پرداخت
export const updatePayment = async (paymentId, paymentData) => {
  try {
    const response = await axios.put(
      `${API_URL}/payments/${paymentId}`,
      paymentData,
    );
    return response.data; // { success: true, message: "...", data: { payment, loan } }
  } catch (error) {
    console.error("❌ Error updating payment:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
};

// حذف پرداخت
export const deletePayment = async (paymentId) => {
  try {
    const response = await axios.delete(`${API_URL}/payments/${paymentId}`);
    return response.data; // { success: true, message: "..." }
  } catch (error) {
    console.error("❌ Error deleting payment:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
};

// ==================== Report APIs ====================

// دریافت خلاصه گزارش کمپنی
export const getCompanySummary = async () => {
  try {
    const response = await axios.get(`${API_URL}/reports/summary`);
    return response.data; // { success: true, data: summary }
  } catch (error) {
    console.error("❌ Error fetching company summary:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
};

// دریافت آمار داشبورد
export const getDashboardStats = async () => {
  try {
    const response = await axios.get(`${API_URL}/reports/dashboard`);
    return response.data; // { success: true, data: stats }
  } catch (error) {
    console.error("❌ Error fetching dashboard stats:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
};

// دریافت تاریخچه قرضه‌های یک کارمند
export const getEmployeeLoanHistory = async (employeeId) => {
  try {
    const response = await axios.get(
      `${API_URL}/reports/employee/${employeeId}/loans`,
    );
    return response.data; // { success: true, data: { employee, statistics, loans } }
  } catch (error) {
    console.error("❌ Error fetching employee loan history:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
};

// دریافت گزارش پرداخت‌ها با فیلتر
export const getPaymentsReport = async ({
  startDate,
  endDate,
  employeeId,
} = {}) => {
  try {
    const response = await axios.get(`${API_URL}/reports/payments`, {
      params: {
        startDate,
        endDate,
        employeeId,
      },
    });
    return response.data; // { success: true, data: { summary, groupedByDate, payments } }
  } catch (error) {
    console.error("❌ Error fetching payments report:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
};

// دریافت گزارش قرضه‌ها با فیلتر
export const getLoansReport = async ({
  status,
  startDate,
  endDate,
  employeeId,
} = {}) => {
  try {
    const response = await axios.get(`${API_URL}/reports/loans`, {
      params: {
        status,
        startDate,
        endDate,
        employeeId,
      },
    });
    return response.data; // { success: true, data: { statistics, loans } }
  } catch (error) {
    console.error("❌ Error fetching loans report:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
};

// ==================== Utility Functions ====================

// فرمت کننده پول
export const formatMoney = (amount) => {
  if (!amount && amount !== 0) return "۰";
  return new Intl.NumberFormat("fa-AF", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

// فرمت کننده تاریخ
export const formatDate = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("fa-AF", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

// نسخه ایمن برای دریافت لیست کارمندان با والت
export const getAllEmployeesWithWalletsSafe = async () => {
  try {
    const employees = await getAllEmployeesSafe();

    // اگر employees آرایه باشد
    if (Array.isArray(employees)) {
      return employees;
    }

    return [];
  } catch (error) {
    console.error("Error in getAllEmployeesWithWalletsSafe:", error);
    return [];
  }
};

// دریافت کارمندانی که قرضه فعال دارند
export const getEmployeesWithActiveLoans = async () => {
  try {
    const response = await getActiveLoans();

    if (response?.success && response?.data?.loans) {
      // استخراج کارمندان از لیست قرضه‌ها
      const employees = response.data.loans.map((loan) => ({
        id: loan.Employee?.id,
        fullName: loan.Employee?.fullName,
        position: loan.Employee?.position,
        loanId: loan.id,
        remainingAmount: loan.remainingAmount,
        loanDate: loan.loanDate,
      }));

      return employees;
    }

    return [];
  } catch (error) {
    console.error("Error in getEmployeesWithActiveLoans:", error);
    return [];
  }
};

// دریافت خلاصه وضعیت مالی
export const getFinancialSummary = async () => {
  try {
    const [summaryRes, walletsRes] = await Promise.all([
      getCompanySummary(),
      getAllWallets(),
    ]);

    return {
      success: true,
      data: {
        company: summaryRes?.data?.summary || {},
        wallets: walletsRes?.data?.wallets || [],
        walletSummary: walletsRes?.data?.summary || {},
      },
    };
  } catch (error) {
    console.error("Error in getFinancialSummary:", error);
    return {
      success: false,
      data: {
        company: {},
        wallets: [],
        walletSummary: {},
      },
    };
  }
};
