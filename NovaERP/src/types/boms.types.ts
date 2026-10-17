export interface BOMItemDto {
  id: string;
  bomId: string;
  rawMaterialProductId: string;
  rawMaterialProductName: string;
  quantity: number;
  unitId: string;
  unitName: string;
  wastePercentage: number;
  remarks?: string;
}

export interface BOMDto {
  id: string;
  productId: string;
  productName: string;
  version: string;
  description?: string;
  effectiveDate: string;
  isActive: boolean;
  items: BOMItemDto[];
}

export interface CreateBOMItemDto {
  rawMaterialProductId: string;
  quantity: number;
  unitId: string;
  wastePercentage: number;
  remarks?: string;
}

export interface CreateBOMDto {
  productId: string;
  version: string;
  description?: string;
  effectiveDate: string;
  isActive: boolean;
  items: CreateBOMItemDto[];
}

export interface UpdateBOMItemDto {
  id?: string;
  rawMaterialProductId: string;
  quantity: number;
  unitId: string;
  wastePercentage: number;
  remarks?: string;
}

export interface UpdateBOMDto {
  version: string;
  description?: string;
  effectiveDate: string;
  isActive: boolean;
  items: UpdateBOMItemDto[];
}
