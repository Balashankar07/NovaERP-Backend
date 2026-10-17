import { api } from "@/lib/api-helper";
import { PagedResult } from '../types/common.types';
import {
  FinanceSummary,
  ChartOfAccount,
  CreateChartOfAccountDto,
  CustomerInvoice,
  CreateCustomerInvoiceDto,
  SupplierInvoice,
  CreateSupplierInvoiceDto,
  Payment,
  RecordPaymentDto,
  AccountsPayableSummary,
  AccountsReceivableSummary,
  JournalEntry,
  CreateJournalEntryDto
} from '../types/finance.types';

export const financeApi = {
  getSummary: () =>
    api.get<FinanceSummary>('/Finance/overview'),

  getChartOfAccounts: () =>
    api.get<ChartOfAccount[]>('/Finance/chart-of-accounts'),

  createChartOfAccount: (data: CreateChartOfAccountDto) =>
    api.post<ChartOfAccount>('/Finance/chart-of-accounts', data),

  getCustomerInvoices: (params?: { pageNumber?: number; pageSize?: number; search?: string }) =>
    api.get<PagedResult<CustomerInvoice>>('/Finance/customer-invoices', { params }),

  getCustomerInvoiceById: (id: string) =>
    api.get<CustomerInvoice>(`/Finance/customer-invoices/${id}`),

  createCustomerInvoice: (data: CreateCustomerInvoiceDto) =>
    api.post<CustomerInvoice>('/Finance/customer-invoices', data),

  approveCustomerInvoice: (id: string) =>
    api.post<CustomerInvoice>(`/Finance/customer-invoices/${id}/approve`),

  cancelCustomerInvoice: (id: string) =>
    api.post<CustomerInvoice>(`/Finance/customer-invoices/${id}/cancel`),

  getSupplierInvoices: (params?: { pageNumber?: number; pageSize?: number; search?: string }) =>
    api.get<PagedResult<SupplierInvoice>>('/Finance/supplier-invoices', { params }),

  getSupplierInvoiceById: (id: string) =>
    api.get<SupplierInvoice>(`/Finance/supplier-invoices/${id}`),

  createSupplierInvoice: (data: CreateSupplierInvoiceDto) =>
    api.post<SupplierInvoice>('/Finance/supplier-invoices', data),

  approveSupplierInvoice: (id: string) =>
    api.post<SupplierInvoice>(`/Finance/supplier-invoices/${id}/approve`),

  cancelSupplierInvoice: (id: string) =>
    api.post<SupplierInvoice>(`/Finance/supplier-invoices/${id}/cancel`),

  getPayments: (params?: { pageNumber?: number; pageSize?: number; search?: string }) =>
    api.get<PagedResult<Payment>>('/Finance/payments', { params }),

  recordPayment: (data: RecordPaymentDto) =>
    api.post<Payment>('/Finance/payments', data),

  approvePayment: (id: string) =>
    api.post<Payment>(`/Finance/payments/${id}/approve`),

  getAccountsPayableSummary: () =>
    api.get<AccountsPayableSummary>('/Finance/accounts-payable'),

  getAccountsReceivableSummary: () =>
    api.get<AccountsReceivableSummary>('/Finance/accounts-receivable'),

  getJournalEntries: (params?: { pageNumber?: number; pageSize?: number; search?: string }) =>
    api.get<PagedResult<JournalEntry>>('/Finance/journals', { params }),

  getJournalEntryById: (id: string) =>
    api.get<JournalEntry>(`/Finance/journals/${id}`),

  createJournalEntry: (data: CreateJournalEntryDto) =>
    api.post<JournalEntry>('/Finance/journals', data),

  postJournalEntry: (id: string) =>
    api.post<JournalEntry>(`/Finance/journals/${id}/post`),
};
