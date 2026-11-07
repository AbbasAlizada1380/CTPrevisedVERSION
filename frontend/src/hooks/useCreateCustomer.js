import { useState } from "react";
import Swal from "sweetalert2";
import { createCustomer } from "../pages/dashboard/services/CustomerService";

export const useCreateCustomer = (onSuccess) => {
  const [loading, setLoading] = useState(false);

  const submitCustomer = async (formData) => {
    try {
      setLoading(true);

      if (
        formData.customerType === "print" &&
        typeof formData.isStock !== "boolean"
      ) {
        Swal.fire(
          "خطا",
          "لطفاً مشخص کنید مشتری چاپ انباری است یا خیر",
          "warning",
        );
        return false;
      }

      const newCustomer = await createCustomer(formData);

      Swal.fire({
        icon: "success",
        title: "ثبت شد",
        text: "مشتری با موفقیت اضافه شد",
        timer: 1500,
        showConfirmButton: false,
      });

      if (onSuccess) {
        onSuccess(newCustomer);
      }

      return true;
    } catch (error) {
      Swal.fire(
        "خطا",
        error.response?.data?.message || "مشکلی پیش آمد",
        "error",
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { submitCustomer, loading };
};
