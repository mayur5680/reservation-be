"use strict";

export interface IvrsDetails {
  id?: number;
  callerId: string;
  sip?: string;
  callstart?: Date;
  callend?: Date | null;
  from: string;
  to: string;
  duration?: string;
  status?: string;
  is_recorded?: boolean;
  pbx_call_id?: string;
  direction?: string;
  notes?: string;
  tags?: string;
  pressedDigit?: string | null;
  isDone?: boolean;
  is_completed?: boolean;
  companyId?: number;
  customerId?: number | null;
  outletId?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  createdBy?: number;
  updatedBy?: number;
}
