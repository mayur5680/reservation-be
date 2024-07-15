"use strict";

export interface OutletUser {
  id?: number;
  userId: number;
  outletId: number;
  roleId: number;
  createdBy?: number;
  updatedBy?: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
