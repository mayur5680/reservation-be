"use strict";

export interface UserPermission {
  id?: number;
  outletId?: number;
  roleId: number;
  permission: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  createdBy?: number;
  updatedBy?: number;
}
