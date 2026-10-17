export interface SupplierDto {
  id: string;
  supplierCode: string;
  supplierName: string;
  companyName?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  website?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  taxRegistrationNumber?: string;
  paymentTerms?: string;
  currency?: string;
  creditLimit?: number;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateSupplierDto {
  supplierCode: string;
  supplierName: string;
  companyName?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  website?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  taxRegistrationNumber?: string;
  paymentTerms?: string;
  currency?: string;
  creditLimit?: number;
  notes?: string;
  isActive: boolean;
}

export interface UpdateSupplierDto extends CreateSupplierDto {}

export interface SupplierProductDto {
  id: string;
  supplierId: string;
  supplierName: string;
  productId: string;
  productName: string;
  productCode: string;
  supplierSKU: string;
  unitPrice: number;
  moq: number;
  leadTimeDays: number;
  currency: string;
  isPreferred: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateSupplierProductDto {
  supplierId: string;
  productId: string;
  supplierSKU: string;
  unitPrice: number;
  moq: number;
  leadTimeDays: number;
  currency?: string;
  isPreferred: boolean;
}

export interface UpdateSupplierProductDto {
  supplierSKU: string;
  unitPrice: number;
  moq: number;
  leadTimeDays: number;
  currency?: string;
  isPreferred: boolean;
  isActive: boolean;
}
