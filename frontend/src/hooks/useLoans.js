import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getActiveLoans,
  getClosedLoans,
  getLoanById,
  createLoan,
  closeLoan,
  getLoanPayments,
  makePayment,
} from "../pages/dashboard/services/EmployeesService";

// ==================== Loan Hooks ====================

export const useActiveLoans = () => {
  return useQuery({
    queryKey: ["activeLoans"],
    queryFn: getActiveLoans,
  });
};

export const useClosedLoans = (params) => {
  return useQuery({
    queryKey: ["closedLoans", params],
    queryFn: () => getClosedLoans(params),
    keepPreviousData: true,
  });
};

export const useLoan = (id) => {
  return useQuery({
    queryKey: ["loan", id],
    queryFn: () => getLoanById(id),
    enabled: !!id,
  });
};

export const useLoanPayments = (loanId) => {
  return useQuery({
    queryKey: ["loanPayments", loanId],
    queryFn: () => getLoanPayments(loanId),
    enabled: !!loanId,
  });
};

export const useCreateLoan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLoan,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["activeLoans"] });
      queryClient.invalidateQueries({
        queryKey: ["employee", variables.employeeId],
      });
      queryClient.invalidateQueries({ queryKey: ["allEmployees"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      queryClient.invalidateQueries({ queryKey: ["companySummary"] });
    },
  });
};

export const useCloseLoan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: closeLoan,
    onSuccess: (_, loanId) => {
      queryClient.invalidateQueries({ queryKey: ["activeLoans"] });
      queryClient.invalidateQueries({ queryKey: ["closedLoans"] });
      queryClient.invalidateQueries({ queryKey: ["loan", loanId] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
};

export const useMakePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: makePayment,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["loan", variables.loanId] });
      queryClient.invalidateQueries({
        queryKey: ["loanPayments", variables.loanId],
      });
      queryClient.invalidateQueries({ queryKey: ["activeLoans"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      queryClient.invalidateQueries({ queryKey: ["companySummary"] });
    },
  });
};
