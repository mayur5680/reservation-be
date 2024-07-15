"use strict";

export interface OutletTag {
  id?: number;
  outletId: number;
  tagId: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  createdBy?: number;
  updatedBy?: number;
}
