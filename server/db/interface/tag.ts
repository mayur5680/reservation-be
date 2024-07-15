"use strict";

export interface Tag {
  id?: number;
  name: string;
  description: string;
  tagCategoryId: number;
  outletId?: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  createdBy?: number;
  updatedBy?: number;
}
