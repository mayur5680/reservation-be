"use strict";

export interface OutletSeatType {
  id?: number;
  outletId: number;
  seatTypeId: number;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  createdBy?: number;
  updatedBy?: number;
}
