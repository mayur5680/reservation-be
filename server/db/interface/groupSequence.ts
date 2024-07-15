"use strict";

export interface GroupSequnceTable {
  id?: number;
  groupTableId: number;
  outletTableId: number;
  index?: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  createdBy?: number;
  updatedBy?: number;
}
