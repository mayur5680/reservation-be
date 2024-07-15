import { Op } from "sequelize";
import { Customer } from "../db/interface";

export const FieldName = {
  GENDER: "gender",
  BIRTHDAY: "dob",
  ADDRESS: "address",
  POSTALCODE: "postalCode",
  ACTIVATIONDATE: "createdAt",
  AVERAGESPEND: "averageSpend",
  EATPOINTS: "eatPoints",
  LAST_TRANSACTION_DATE: "lastTransactionDate",
  OUTLETNAME: "outletName",
};

export const Criteria: any = {
  "=": [Op.eq],
  ">": [Op.gt],
  ">=": [Op.gte],
  "<": [Op.lt],
  "<=": [Op.lte],
};

export type CriteriaValue = {
  value1: string;
  value2: string;
  displayValue1?: string;
  displayValue2?: string;
};

export interface CriteriaPayload {
  fieldName: string;
  criteria: string;
  value: string | CriteriaValue;
  displayName?: string;
  displayCriteria?: string;
  displayValue?: string;
}

export interface CustomerPayload extends Customer {
  outletName: string;
}
