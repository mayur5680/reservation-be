"use strict";

export interface Checkout {
  id?: number;
  outletInvoiceId: string;
  transactionId: string;
  stripeResponse?: string;
  status: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  createdBy?: number;
  updatedBy?: number;
}
