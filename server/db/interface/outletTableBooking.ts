"use strict";

export interface OutletTableBooking {
  id?: number;
  outletInvoiceId: string;
  outletTableId: number;
  outletId: number;
  bookingStartTime: Date;
  bookingEndTime: Date;
  status?: string;
  seatStartTime?: Date;
  seatEndTime?: Date;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  createdBy?: number;
  updatedBy?: number;
}
