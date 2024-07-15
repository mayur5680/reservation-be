"use strict";

export interface Payment {
  sessionId: string;
  customerId: number;
  outletId: number;
  request: string;
  client_secret?: string;
  sessionResponse: string;
  outletInvoiceId?: string;
  is_Success?: boolean;
  is_Event?: boolean;
  ticketingId?: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  createdBy?: number;
  updatedBy?: number;
}
