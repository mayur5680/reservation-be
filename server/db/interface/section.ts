"use strict";

export interface Section {
  id?: number;
  name: string;
  description: string;
  outletId: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  createdBy?: number;
  updatedBy?: number;
}
