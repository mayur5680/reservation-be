"use strict";

export interface CustomerLogs {
  id?: number;
  customerId: number;
  logType: string;
  purpose?: string;
  moduleName?: string;
  action?: string;
  contentChange?: string;
  outletInvoiceId?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  createdBy?: number;
  updatedBy?: number;
}
