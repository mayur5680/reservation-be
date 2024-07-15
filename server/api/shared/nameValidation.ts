import { ApiError } from "../../@types/apiError";
import { Exceptions } from "../../exception";
import { StatusCode } from "../../context";

interface WhereClause {
  [key: string]: any;
}

export const nameValidation = async (
  repository: any,
  condition: WhereClause,
  includeStatement: any = []
): Promise<void> => {
  const isRecordExist = await repository.findOne({
    where: condition,
    include: includeStatement,
  });
  if (isRecordExist)
    throw new ApiError({
      message: Exceptions.NAME_ALREADY_EXISTS,
      statusCode: StatusCode.BAD_REQUEST,
    });
};

export const CapitalizeFirstLetter = (str: string) => {
  // converting first letter to uppercase
  const capitalized = str.charAt(0).toUpperCase() + str.slice(1);

  return capitalized;
};

export const findTags = async (
  repository: any,
  condition: WhereClause
): Promise<any> => {
  const isRecordExist = await repository.findAll({ where: condition });
  return isRecordExist;
};
