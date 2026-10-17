export interface UnitDto {
  id: string;
  name: string;
  abbreviation: string;
  description?: string;
  isActive: boolean;
}

export interface CreateUnitDto {
  name: string;
  abbreviation: string;
  description?: string | null;
}

export interface UpdateUnitDto {
  name: string;
  abbreviation: string;
  description?: string | null;
  isActive: boolean;
}
