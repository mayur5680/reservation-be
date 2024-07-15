"use strict";

export interface GroupPossibility {
  id?: number;
  groupTableId: number;
  index?: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  createdBy?: number;
  updatedBy?: number;
}
