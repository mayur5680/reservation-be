import { compact } from "lodash";
import { ComapnyModule } from "../context";
import { modulePermission, moduleTruePermission } from "./userPermission";
export interface CreateSuperAdminPayload {
  email: string;
  password: string;
}

export interface CreateUserPayload extends CreateSuperAdminPayload {
  outletId: number;
  roleId: number;
  permission?: modulePermissionPayload[];
}

interface modulePermissionPayload {
  isCreate: boolean | null;
  isRead: boolean | null;
  isUpdate: boolean | null;
  isDelete: boolean | null;
}

interface CompanyPermissionPayload {
  id: number;
  permission: modulePermissionPayload[];
}

export interface UpdateUserPayload {
  userName?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  roleId?: number;
  isActive?: boolean;
  companyPermission?: CompanyPermissionPayload;
}

const data = Object.values(ComapnyModule);

export const defaultCompanyPermission = compact(
  data.map((moduleName) => {
    if (moduleName === ComapnyModule.IVRSCONFIGURATION) {
      return {
        moduleName,
        ...modulePermission,
        isCreate: null,
        isDelete: null,
      };
    }
    if (moduleName === ComapnyModule.REPORTS) {
      return {
        moduleName,
        ...modulePermission,
        isCreate: null,
        isDelete: null,
        isUpdate: null,
      };
    }

    return { moduleName, ...modulePermission };
  })
);

export const defaultSuperUserCompanyPermission = compact(
  data.map((moduleName) => {
    if (moduleName === ComapnyModule.IVRSCONFIGURATION) {
      return {
        moduleName,
        ...moduleTruePermission,
        isCreate: null,
        isDelete: null,
      };
    }
    if (moduleName === ComapnyModule.REPORTS) {
      return {
        moduleName,
        ...moduleTruePermission,
        isCreate: null,
        isDelete: null,
        isUpdate: null,
      };
    }

    return { moduleName, ...moduleTruePermission };
  })
);
