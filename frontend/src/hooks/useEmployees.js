import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getAllEmployeesSafe,
} from "../pages/dashboard/services/EmployeesService";
import { toast } from "react-hot-toast";

// ==================== Employee Hooks ====================

export const useEmployees = (params) => {
  return useQuery({
    queryKey: ["employees", params],
    queryFn: () => getEmployees(params),
    keepPreviousData: true,
  });
};

export const useAllEmployees = () => {
  return useQuery({
    queryKey: ["allEmployees"],
    queryFn: getAllEmployeesSafe,
  });
};

export const useEmployee = (id) => {
  return useQuery({
    queryKey: ["employee", id],
    queryFn: () => getEmployeeById(id),
    enabled: !!id,
  });
};

export const useCreateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["allEmployees"] });
      toast.success("کارمند با موفقیت ثبت شد");
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "خطا در ثبت کارمند");
    },
  });
};

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateEmployee(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employee", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["allEmployees"] });
      toast.success("کارمند با موفقیت بروزرسانی شد");
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "خطا در بروزرسانی کارمند");
    },
  });
};

export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["allEmployees"] });
      toast.success("کارمند با موفقیت حذف شد");
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "خطا در حذف کارمند");
    },
  });
};
