import { Sequelize } from "sequelize";
import { User } from "../db/interface/user";
import { Outlet } from "../db/interface/outlet";

export interface SystemLogPayload {
  type: string;
  action: string;
  module: string;
  user: User;
  outlet: Outlet | null;
  sequelize: Sequelize;
  status?: string;
  contentChange?: string | null;
  requestData?: string | null;
  responseData?: string | null;
}

export interface FilterSystemLog {
  date?: Date;
}

export interface SystemLogRequest {
  fromDate: Date;
  toDate: Date;
}
