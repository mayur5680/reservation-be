"use strict";

export interface Materials {
  id?: number;
  outletId: number;
  title: string;
  description?: string;
  type: string;
  attachment: string;
  thumbnail?: string;
  tags?: string;
  categoryId: number;
  subCategoryId: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  createdBy?: number;
  updatedBy?: number;
}
