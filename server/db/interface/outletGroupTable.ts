"use strict";

export interface OutletGroupTable {
  id?: number;
  groupPossibilityId: number;
  outletTableId: number;
  index?: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  createdBy?: number;
  updatedBy?: number;
}
