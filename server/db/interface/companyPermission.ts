"use strict";

export interface CompanyPermission {
  id?: number;
  userId?: number;
  companyId: number;
  permission: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  createdBy?: number;
  updatedBy?: number;
}
