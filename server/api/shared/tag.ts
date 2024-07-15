import { Op, Sequelize } from "sequelize";
import {
  CompanyDbInterface,
  CustomerDbInterface,
  IvrsDetailDbInterface,
  MarketingDbInterface,
  MaterialsDbInterface,
} from "../../db-interfaces";
import { TagDbModel } from "../../db/models";
import { findTags } from "./nameValidation";

export const deleteTags = async (
  deletedTag: TagDbModel,
  sequelize: Sequelize
): Promise<void> => {
  try {
    let repository = null;
    switch (deletedTag.TagCategory?.id) {
      case 32:
        repository = new CustomerDbInterface(sequelize);
        break;
      case 33:
        repository = new CompanyDbInterface(sequelize);
        break;
      case 34:
        repository = new IvrsDetailDbInterface(sequelize);
        break;
      case 37:
        repository = new MaterialsDbInterface(sequelize);
        break;
      case 42:
        repository = new MarketingDbInterface(sequelize);
        break;
    }

    if (repository) {
      const result = await findTags(repository.repository, {
        tags: {
          [Op.like]: `%"id":${deletedTag.id}%`,
        },
      });

      await Promise.all(
        result.map(async (data: any) => {
          const tags = JSON.parse(data.tags);
          const filterData = tags.filter(
            (tag: any) => tag.id !== deletedTag.id
          );

          data.tags = JSON.stringify(filterData);
          await data.save();
        })
      );
    }
  } catch (error) {
    throw error;
  }
};
