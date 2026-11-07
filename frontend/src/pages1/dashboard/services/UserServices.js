import axios from "axios";
import Swal from "sweetalert2";

const BASE_URL = import.meta.env.VITE_BASE_URL;

// ✅ Create user
export const createUser = async (userData) => {
  try {
    const res = await axios.post(`${BASE_URL}/users/register/`, userData);
    Swal.fire({
      icon: "success",
      title: "کاربر با موفقیت اضافه شد!",
      showConfirmButton: false,
      timer: 1800,
    });
    return res.data;
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "خطا در ایجاد کاربر!",
      text: error.response?.data?.message || "مشکلی رخ داد، دوباره تلاش کنید.",
    });
    throw error;
  }
};

// ✅ Get all users
export const getUsers = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/users/`);
    return res.data;
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "خطا در دریافت لیست کاربران!",
      text: error.response?.data?.message || "ارتباط با سرور برقرار نشد.",
    });
    throw error;
  }
};

// ✅ Update user
export const updateUser = async (id, userData) => {
  try {
    const res = await axios.put(`${BASE_URL}/users/update/${id}/`, userData);
    Swal.fire({
      icon: "success",
      title: "اطلاعات کاربر با موفقیت بروزرسانی شد!",
      showConfirmButton: false,
      timer: 1800,
    });
    return res.data;
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "خطا در بروزرسانی کاربر!",
      text: error.response?.data?.message || "مشکلی در سرور وجود دارد.",
    });
    throw error;
  }
};

// ✅ Delete user
export const deleteUser = async (id) => {
  try {
    await Swal.fire({
      title: "آیا مطمئن هستید؟",
      text: "این کاربر حذف خواهد شد!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "بله، حذف شود!",
      cancelButtonText: "خیر، لغو کن!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        await axios.delete(`${API_URL}delete/${id}/`);
        Swal.fire({
          icon: "success",
          title: "کاربر با موفقیت حذف شد!",
          showConfirmButton: false,
          timer: 1500,
        });
      }
    });
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "خطا در حذف کاربر!",
      text: error.response?.data?.message || "مشکلی در سرور وجود دارد.",
    });
    throw error;
  }
};
