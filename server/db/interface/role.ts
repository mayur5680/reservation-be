"use strict";

export interface Role {
  id?: number;
  name: string;
  description?: string;
  outletId: number;
  createdBy?: number;
  updatedBy?: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
