import { BrandDto } from "./brands.types";
import { CategoryDto } from "./categories.types";
import { UnitDto } from "./units.types";

export enum ProductType {
  FinishedGood = "FinishedGood",
  Component = "Component",
}

export interface ProductSpecificationDto {
  id?: string;
  attributeName: string;
  value: string;
  displayOrder: number;
}

export interface ProductDto {
  id: string;
  productNumber: string;
  productCode: string;
  sku: string;
  barcode?: string;
  
  name: string;
  description?: string;
  productType: ProductType;
  
  categoryId: string;
  category?: CategoryDto;
  
  brandId: string;
  brand?: BrandDto;
  
  unitId: string;
  unit?: UnitDto;
  
  costPrice: number;
  sellingPrice: number;
  minimumStock: number;
  maximumStock: number;
  reorderLevel: number;
  imageUrl?: string;
  specifications?: ProductSpecificationDto[];
  isActive: boolean;
}

export interface CreateProductDto {
  name: string;
  description?: string;
  productType: ProductType;
  
  categoryId: string;
  brandId: string;
  unitId: string;
  
  costPrice: number;
  sellingPrice: number;
  minimumStock: number;
  maximumStock: number;
  reorderLevel: number;
  
  imageUrl?: string;
  specifications?: ProductSpecificationDto[];
}

export interface UpdateProductDto {
  name: string;
  description?: string;
  productType: ProductType;
  
  categoryId: string;
  brandId: string;
  unitId: string;
  
  costPrice: number;
  sellingPrice: number;
  minimumStock: number;
  maximumStock: number;
  reorderLevel: number;
  
  imageUrl?: string;
  specifications?: ProductSpecificationDto[];
  isActive: boolean;
}
