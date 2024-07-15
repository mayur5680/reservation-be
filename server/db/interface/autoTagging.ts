"use strict";

export interface AutoTagging {
  id?: number;
  criteria?: string;
  tagId: number;
  outletId: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  createdBy?: number;
  updatedBy?: number;
}
