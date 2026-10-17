export interface BrandDto {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

export interface CreateBrandDto {
  name: string;
  description: string | null;
}

export interface UpdateBrandDto {
  name: string;
  description: string | null;
  isActive: boolean;
}
