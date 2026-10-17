export interface CategoryDto {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

export interface CreateCategoryDto {
  name: string;
  description: string | null;
}

export interface UpdateCategoryDto {
  name: string;
  description: string | null;
  isActive: boolean;
}
