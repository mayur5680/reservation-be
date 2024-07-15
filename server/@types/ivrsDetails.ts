export interface IvrsResponse {
  call_id: string;
  sip: string;
  callstart: Date;
  callend?: Date;
  from: string;
  to: string;
  status?: string;
  duration?: string;
  direction?: string
  is_recorded?: boolean;
  pbx_call_id: string;
}

export interface ZadarmaIncomingResponse {
  status: string;
  start: string;
  end: string;
  version: string;
  stats: IvrsResponse[];
}

export interface IvrsPayload {
  fromDate?: Date;
  toDate?: Date;
}

export interface UpdateIvrsDetails {
  isDone: boolean;
  tags?: string;
  notes?: string;
}
