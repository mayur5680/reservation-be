"use strict";

export interface SeatingType {
  id?: number;
  name: string;
  outletId?: number;
  description?: string;
  isActive?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  createdBy?: number;
  updatedBy?: number;
}
