import { Repository } from "sequelize-typescript";

export class BaseInterface<DbModel> {
  repository: Repository<DbModel>;
  constructor(Dbmodel: any, sequelize: any) {
    this.repository = sequelize.getRepository(Dbmodel);
  }
}
