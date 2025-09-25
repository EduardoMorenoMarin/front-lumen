export interface Category {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryCreateInput {
  name: string;
  description?: string | null;
  active: boolean;
}

export interface CategoryUpdateInput {
  name: string;
  description?: string | null;
  active: boolean;
}

export type CategoryPatchInput = Partial<CategoryUpdateInput>;
