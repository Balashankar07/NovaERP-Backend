export enum AccountType {
  Asset = 1,
  Liability = 2,
  Equity = 3,
  Revenue = 4,
  Expense = 5
}

export enum InvoiceStatus {
  Draft = 1,
  Approved = 2,
  PartiallyPaid = 3,
  Paid = 4,
  Cancelled = 5
}

export enum PaymentType {
  CustomerPayment = 1,
  SupplierPayment = 2
}

export enum PaymentMethod {
  BankTransfer = 1,
  CreditCard = 2,
  Check = 3,
  Cash = 4
}

export enum PaymentStatus {
  Recorded = 1,
  Approved = 2,
  Cancelled = 3
}

export enum JournalStatus {
  Draft = 1,
  Posted = 2,
  Cancelled = 3
}

export interface ChartOfAccount {
  id: string;
  accountCode: string;
  accountName: string;
  type: AccountType;
  description?: string;
  isActive: boolean;
  currentBalance: number;
}

export interface CreateChartOfAccountDto {
  accountCode: string;
  accountName: string;
  type: AccountType;
  description?: string;
}

export interface CustomerInvoiceItem {
  id: string;
  productId?: string;
  productName?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface CustomerInvoice {
  id: string;
  invoiceNumber: string;
  salesOrderId?: string;
  salesOrderNumber?: string;
  customerId?: string;
  customerName: string;
  customerAddress?: string;
  invoiceDate: string;
  dueDate: string;
  subTotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  status: InvoiceStatus;
  notes?: string;
  items: CustomerInvoiceItem[];
}

export interface CreateCustomerInvoiceItemDto {
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateCustomerInvoiceDto {
  invoiceNumber?: string;
  salesOrderId?: string;
  customerId?: string;
  customerName: string;
  customerAddress?: string;
  invoiceDate: string;
  dueDate: string;
  taxRate: number;
  notes?: string;
  items: CreateCustomerInvoiceItemDto[];
}

export interface SupplierInvoiceItem {
  id: string;
  productId?: string;
  productName?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface SupplierInvoice {
  id: string;
  invoiceNumber: string;
  purchaseOrderId?: string;
  purchaseOrderNumber?: string;
  goodsReceiptId?: string;
  goodsReceiptNumber?: string;
  supplierId: string;
  supplierName: string;
  invoiceDate: string;
  dueDate: string;
  subTotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  status: InvoiceStatus;
  notes?: string;
  items: SupplierInvoiceItem[];
}

export interface CreateSupplierInvoiceItemDto {
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateSupplierInvoiceDto {
  invoiceNumber?: string;
  purchaseOrderId?: string;
  goodsReceiptId?: string;
  supplierId: string;
  invoiceDate: string;
  dueDate: string;
  taxRate: number;
  notes?: string;
  items: CreateSupplierInvoiceItemDto[];
}

export interface Payment {
  id: string;
  paymentNumber: string;
  type: PaymentType;
  customerInvoiceId?: string;
  customerInvoiceNumber?: string;
  supplierInvoiceId?: string;
  supplierInvoiceNumber?: string;
  paymentDate: string;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionReference?: string;
  notes?: string;
  status: PaymentStatus;
}

export interface RecordPaymentDto {
  type: PaymentType;
  customerInvoiceId?: string;
  supplierInvoiceId?: string;
  paymentDate: string;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionReference?: string;
  notes?: string;
}

export interface AccountsPayableSummary {
  totalOutstanding: number;
  totalPaid: number;
  pendingInvoicesCount: number;
  overdueAmount: number;
  invoices: SupplierInvoice[];
}

export interface AccountsReceivableSummary {
  totalOutstanding: number;
  totalCollected: number;
  pendingInvoicesCount: number;
  overdueAmount: number;
  invoices: CustomerInvoice[];
}

export interface JournalEntryLine {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  description?: string;
  debit: number;
  credit: number;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  entryDate: string;
  description: string;
  sourceDocumentType?: string;
  sourceDocumentId?: string;
  status: JournalStatus;
  totalDebit: number;
  totalCredit: number;
  lines: JournalEntryLine[];
}

export interface CreateJournalEntryLineDto {
  accountId: string;
  description?: string;
  debit: number;
  credit: number;
}

export interface CreateJournalEntryDto {
  entryDate: string;
  description: string;
  sourceDocumentType?: string;
  sourceDocumentId?: string;
  lines: CreateJournalEntryLineDto[];
}

export interface FinanceSummary {
  totalAccountsReceivable: number;
  totalAccountsPayable: number;
  totalCashAndBank: number;
  netSalesRevenue: number;
  totalCostOfGoodsSold: number;
  totalOperatingExpenses: number;
  pendingCustomerInvoicesCount: number;
  pendingSupplierInvoicesCount: number;
  totalJournalEntriesCount: number;
}
