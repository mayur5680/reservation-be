import { DiningOptionsPayload } from "../../@types/customerBooking";
import { DiningOptionDbModel } from "../../db/models";
import { Loglevel } from "../../context";
import { Log } from "../../context/Logs";

export const dayMaxQtyDiningOption = async (
  diningOption: DiningOptionDbModel,
  getInvoices: any[],
  uniqueId: string
): Promise<Number> => {
  try {
    Log.writeLog(
      Loglevel.INFO,
      "dayMaxQtyDiningOption",
      "diningOption",
      diningOption,
      uniqueId
    );

    Log.writeLog(
      Loglevel.INFO,
      "dayMaxQtyDiningOption",
      "getInvoices",
      getInvoices,
      uniqueId
    );

    let countTotalQty = 0;

    await Promise.all(
      getInvoices.map((invoice) => {
        if (invoice.dinningOptions && invoice.dinningOptions.length > 0) {
          invoice.dinningOptions.map((data: DiningOptionsPayload) => {
            if (data.diningOptionId === diningOption.id) {
              countTotalQty += data.diningOptionQty;
            }
          });
        }
      })
    );

    Log.writeLog(
      Loglevel.INFO,
      "dayMaxQtyDiningOption",
      "countTotalQty",
      countTotalQty,
      uniqueId
    );

    return countTotalQty;
  } catch (error) {
    Log.writeLog(
      Loglevel.ERROR,
      "dayMaxQtyDiningOption",
      "error",
      error,
      uniqueId
    );
    throw error;
  }
};
