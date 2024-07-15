import { OutletDbModel, RoleDbModel } from "../../server/db/models";

export type UserOutletResponse = {
  outlet: OutletDbModel;
  role?: RoleDbModel;
};
