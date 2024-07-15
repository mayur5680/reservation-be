export interface SystemLog {
  guid?: string;
  type: string;
  name: string;
  identifier: string;
  action: string;
  module: string;
  outletId?: number | null;
  outletInvoiceId?: string | null;
  duration?: string;
  contentChange?: string | null;
  requestData?: string | null;
  responseData?: string | null;
  callerId: string;
  status?: string;
  createdBy?: number;
  updatedBy?: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
