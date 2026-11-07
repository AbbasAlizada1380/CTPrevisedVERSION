import { useQuery } from "@tanstack/react-query";
import {
  getCompanySummary,
  getDashboardStats,
  getEmployeeLoanHistory,
  getPaymentsReport,
  getLoansReport,
  getFinancialSummary,
} from "../pages/dashboard/services/EmployeesService";;

// ==================== Report Hooks ====================

export const useCompanySummary = () => {
  return useQuery({
    queryKey: ["companySummary"],
    queryFn: getCompanySummary,
    refetchInterval: 300000, // هر ۵ دقیقه یکبار
  });
};

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ["dashboardStats"],
    queryFn: getDashboardStats,
    refetchInterval: 60000, // هر ۱ دقیقه یکبار
  });
};

export const useEmployeeLoanHistory = (employeeId) => {
  return useQuery({
    queryKey: ["employeeLoanHistory", employeeId],
    queryFn: () => getEmployeeLoanHistory(employeeId),
    enabled: !!employeeId,
  });
};

export const usePaymentsReport = (params) => {
  return useQuery({
    queryKey: ["paymentsReport", params],
    queryFn: () => getPaymentsReport(params),
    enabled: !!params?.startDate && !!params?.endDate,
  });
};

export const useLoansReport = (params) => {
  return useQuery({
    queryKey: ["loansReport", params],
    queryFn: () => getLoansReport(params),
  });
};

export const useFinancialSummary = () => {
  return useQuery({
    queryKey: ["financialSummary"],
    queryFn: getFinancialSummary,
    refetchInterval: 300000,
  });
};
