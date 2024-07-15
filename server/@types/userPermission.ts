import { compact } from "lodash";
import { ModuleName } from "../context";

export interface PermissionPayload {
  moduleName: string;
  isCreate: boolean;
  isRead: boolean;
  isUpdate: boolean;
  isDelete: boolean;
}

export const modulePermission = {
  isCreate: false,
  isRead: false,
  isUpdate: false,
  isDelete: false,
};

export const moduleTruePermission = {
  isCreate: true,
  isRead: true,
  isUpdate: true,
  isDelete: true,
};

const data = Object.values(ModuleName);

export const defaultPermission = compact(
  data.map((moduleName) => {
    if (
      !(
        moduleName === ModuleName.COMPANYMANAGEMENT ||
        moduleName === ModuleName.SUPERUSER
      )
    ) {
      if (moduleName === ModuleName.CALLMANAGEMENT) {
        return {
          moduleName,
          ...modulePermission,
          isCreate: null,
          isDelete: null,
        };
      }
      if (moduleName === ModuleName.RESERVEDKEYWORDS) {
        return {
          moduleName,
          ...modulePermission,
          isCreate: null,
          isUpdate: null,
          isDelete: null,
        };
      }
      if (moduleName === ModuleName.AUTOTAGGING) {
        return {
          moduleName,
          ...modulePermission,
          isUpdate: null,
        };
      }
      if (moduleName === ModuleName.RESERVATIONMANAGEMENT) {
        return {
          moduleName,
          ...modulePermission,
          isDelete: null,
        };
      }
      return { moduleName, ...modulePermission };
    } else return null;
  })
);

export const defaultTruePermission = compact(
  data.map((moduleName) => {
    if (
      !(
        moduleName === ModuleName.COMPANYMANAGEMENT ||
        moduleName === ModuleName.SUPERUSER
      )
    ) {
      if (moduleName === ModuleName.CALLMANAGEMENT) {
        return {
          moduleName,
          ...moduleTruePermission,
          isCreate: null,
          isDelete: null,
        };
      }

      if (moduleName === ModuleName.RESERVEDKEYWORDS) {
        return {
          moduleName,
          ...moduleTruePermission,
          isCreate: null,
          isUpdate: null,
          isDelete: null,
        };
      }
      if (moduleName === ModuleName.AUTOTAGGING) {
        return {
          moduleName,
          ...moduleTruePermission,
          isUpdate: null,
        };
      }
      if (moduleName === ModuleName.RESERVATIONMANAGEMENT) {
        return {
          moduleName,
          ...moduleTruePermission,
          isDelete: null,
        };
      }
      return { moduleName, ...moduleTruePermission };
    } else return null;
  })
);
