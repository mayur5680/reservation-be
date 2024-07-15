import Imap from "node-imap";
import { Sequelize } from "sequelize";
import { Log } from "../../context/Logs";
import { BookingSource, Loglevel } from "../../context";
import { bookingFromEmail } from "../shared";
import { ReadEmailData } from "../../@types/chope";
import { isEmpty } from "lodash";
let moment = require("moment-timezone");

export const readMail = async (
  imap: Imap,
  sequelize: Sequelize,
  uniqueId: string
) => {
  try {
    const todayDate = moment().format("MMMM DD,YYYY");
    Log.writeLog(Loglevel.INFO, "readMail", "todayDate", todayDate, uniqueId);
    let allMailData: ReadEmailData[] = [];

    function openInbox(cb: {
      (err: any, box: any): void;
      (error: Error, mailbox: Imap.Box): void;
    }) {
      imap.openBox("INBOX", true, cb);
    }

    imap.once("ready", () => {
      Log.writeLog(
        Loglevel.INFO,
        "Start",
        "allMailData",
        allMailData,
        uniqueId
      );

      Log.writeLog(
        Loglevel.INFO,
        "ImapOnce",
        "ImapState",
        imap.state,
        uniqueId
      );

      if (imap.state != "authenticated") {
        imap.connect();
      }

      openInbox(function (err, box) {
        if (err) {
          Log.writeLog(
            Loglevel.ERROR,
            "readMail1",
            "searchingMail",
            err,
            uniqueId
          );
          imap.end();
          throw err;
        }

        imap.search(
          [
            "ALL",
            ["SINCE", todayDate],
            [
              "OR",
              ["FROM", "noreply@chope.co"],
              ["FROM", "no-reply@ghs.google.com"],
            ],
          ],
          (err, results) => {
            try {
              if (err) {
                Log.writeLog(
                  Loglevel.ERROR,
                  "readMail1",
                  "searchingMail",
                  err,
                  uniqueId
                );
                imap.end();
                throw err;
              }

              const f = imap.fetch(results, {
                bodies: ["HEADER", "TEXT"],
              });

              f.on("message", (msg, seqno) => {
                let buffer = "";
                msg.on("body", function (stream, info) {
                  stream.on("data", async function (chunk) {
                    buffer += chunk.toString("utf8");
                  });
                });
                msg.once("end", function () {
                  const readMailData = buffer.split("\n");

                  let readEmailData: any = [];

                  readMailData.map((data) => {
                    if (data.trim().startsWith("From")) {
                      if (data.includes("no-reply@ghs.google.com")) {
                        readEmailData = readHtmlDataFromOddle(
                          readMailData,
                          uniqueId
                        );
                      } else if (data.includes("noreply@chope.co")) {
                        readEmailData = readHtmlDataFromChop(
                          readMailData,
                          uniqueId
                        );
                      }
                    }
                  });

                  if (!isEmpty(readEmailData)) {
                    allMailData.push(readEmailData);
                  }
                });
              });

              f.once("error", function (err) {
                Log.writeLog(
                  Loglevel.ERROR,
                  "readMail2",
                  "searchingMail",
                  err,
                  uniqueId
                );
                imap.end();
              });

              f.once("end", async () => {
                Log.writeLog(
                  Loglevel.INFO,
                  "Finish",
                  "allMailData",
                  allMailData,
                  uniqueId
                );
                imap.end();
                await bookingFromEmail(allMailData, sequelize, uniqueId);
              });
            } catch (error) {
              Log.writeLog(
                Loglevel.ERROR,
                "readMail3",
                "searchingMail",
                error,
                uniqueId
              );
            }
          }
        );
      });
    });

    imap.on("error", function (err) {
      Log.writeLog(Loglevel.ERROR, "readMail4", "searchingMail", err, uniqueId);
      imap.end();
    });

    imap.once("close", function () {
      Log.writeLog(
        Loglevel.INFO,
        "readMail",
        "Connection ended",
        todayDate,
        uniqueId
      );
      imap.destroy();
    });

    Log.writeLog(Loglevel.INFO, "readMail", "ImapState", imap.state, uniqueId);

    if (imap.state != "authenticated") {
      imap.connect();
    }
  } catch (error) {
    Log.writeLog(Loglevel.ERROR, "readMail5", "searchingMail", error, uniqueId);
  }
};

const readHtmlDataFromChop = (readMailData: string[], uniqueId: string) => {
  try {
    let readChopeData: any = {};
    readMailData.map((data, index) => {
      if (data.trim() == "Restaurant") {
        readChopeData.outlet = readMailData[index + 1]
          .replace(/(<([^>]+)>)/gi, "")
          .trim();
      }

      if (data.trim() == "Date") {
        readChopeData.date = readMailData[index + 1]
          .replace(/(<([^>]+)>)/gi, "")
          .trim();
      }

      if (data.trim() == "Time") {
        readChopeData.time = readMailData[index + 1]
          .replace(/(<([^>]+)>)/gi, "")
          .trim();
      }

      if (data.trim() == "Name") {
        readChopeData.name = readMailData[index + 1]

          .replace(/(<([^>]+)>)/gi, "")
          .trim();
      }

      if (data.trim() == "Covers") {
        const noOfPerson = readMailData[index + 1]
          .replace(/(<([^>]+)>)/gi, "")
          .trim();
        const numbers = noOfPerson.match(/\d+(?![^(]*\))/g);
        let totalPax = 0;
        if (numbers) {
          // Convert extracted numbers from string to integers and sum them up
          totalPax = numbers.reduce(function (acc, curr) {
            return acc + parseInt(curr, 10);
          }, 0);
        }
        readChopeData.noOfPerson = totalPax;
      }

      if (data.trim() == "Confirmation Number") {
        readChopeData.bookingID = readMailData[index + 1]
          .replace(/(<([^>]+)>)/gi, "")
          .trim();
      }

      if (data.trim() == "Mobile") {
        readChopeData.mobileNo = readMailData[index + 1]
          .trim()
          .replace(/ /g, "")
          .split("(")[0];
      }

      if (data.trim() == "Email") {
        readChopeData.email = readMailData[index + 1]

          .replace(/(<([^>]+)>)/gi, "")
          .trim();
      }
      if (data.trim() == "Notes") {
        readChopeData.specialRequest = readMailData[index + 1]

          .replace(/(<([^>]+)>)/gi, "")
          .trim();
      }
      if (data.trim() == "New Reservation") {
        readChopeData.status = data.replace(/(<([^>]+)>)/gi, "").trim();
      }
      if (data.trim() == "Cancelled Reservation") {
        readChopeData.status = data.replace(/(<([^>]+)>)/gi, "").trim();
      }
      if (data.trim() == "Edited Reservation") {
        readChopeData.status = data.replace(/(<([^>]+)>)/gi, "").trim();
      }

      readChopeData.source = BookingSource.CHOPE;
    });
    return readChopeData;
  } catch (error) {
    Log.writeLog(
      Loglevel.ERROR,
      "readHtmlDataFromChop",
      "ReadingMail",
      error,
      uniqueId
    );
  }
};

const readHtmlDataFromOddle = (readMailData: string[], uniqueId: string) => {
  try {
    let readOddleData: any = {};
    readMailData.map((data, index) => {
      /* oddle outlet and status*/
      if (data.trim().startsWith("Subject")) {
        const subject = readMailData[index].replace(/(<([^>]+)>)/gi, "").trim();
        var indexOfAt = subject.indexOf(" at");
        var indexOfDash = subject.indexOf("-", indexOfAt);

        if (
          indexOfAt !== -1 &&
          indexOfDash !== -1 &&
          subject.includes("Reservation")
        ) {
          var result = subject.substring(indexOfAt + 3, indexOfDash);
          readOddleData.outlet = result.trim();
        }
      }

      /* oddle  Date and Time */
      if (data.replace(/(<([^>]+)>)/gi, "").trim() == "Date and Time") {
        let dateAndTime = readMailData[index + 1]
          .replace(/(<([^>]+)>)/gi, "")
          .trim()
          .split(",");
        readOddleData.date = moment(dateAndTime[1], "DD MMM YYYY").format(
          "dddd,MMMM DD, YYYY"
        );
        readOddleData.time = dateAndTime[2].trim();
      }

      /* oddle  Name*/
      if (data.replace(/(<([^>]+)>)/gi, "").trim() == "Name") {
        readOddleData.name = readMailData[index + 1]
          .replace(/(<([^>]+)>)/gi, "")
          .trim();
      }

      /* oddle no of person*/
      if (data.replace(/(<([^>]+)>)/gi, "").trim() == "Number of Pax") {
        const noOfPerson = readMailData[index + 1]
          .replace(/(<([^>]+)>)/gi, "")
          .trim();
        const numbers = noOfPerson.match(/\d+(?![^(]*\))/g);
        let totalPax = 0;
        if (numbers) {
          // Convert extracted numbers from string to integers and sum them up
          totalPax = numbers.reduce(function (acc, curr) {
            return acc + parseInt(curr, 10);
          }, 0);
        }
        readOddleData.noOfPerson = totalPax;
      }

      /* oddle  bookingID*/
      if (data.replace(/(<([^>]+)>)/gi, "").trim() == "Booking ID") {
        readOddleData.bookingID = readMailData[index + 1]
          .replace(/(<([^>]+)>)/gi, "")
          .trim();
      }

      /* oddle  Contact Number*/
      if (data.replace(/(<([^>]+)>)/gi, "").trim() == "Contact Number") {
        readOddleData.mobileNo = readMailData[index + 1]
          .replace(/(<([^>]+)>)/gi, "")
          .trim();
      }

      /* oddle  email */
      if (data.replace(/(<([^>]+)>)/gi, "").trim() == "Email") {
        readOddleData.email = readMailData[index + 1]
          .replace(/(<([^>]+)>)/gi, "")
          .trim();
      }

      /* specialRequest */
      if (data.replace(/(<([^>]+)>)/gi, "").trim() == "Special Request") {
        readOddleData.specialRequest = readMailData[index + 1]
          .replace(/(<([^>]+)>)/gi, "")
          .trim();
      }

      /* Status */
      if (data.replace(/(<([^>]+)>)/gi, "").trim() == "Status") {
        const status = readMailData[index + 1]
          .replace(/(<([^>]+)>)/gi, "")
          .trim();

        if (status === "Booked") {
          readOddleData.status = "New Reservation";
        } else if (status === "Modified") {
          readOddleData.status = "Edited Reservation";
        } else {
          readOddleData.status = "Cancelled Reservation";
        }
      }

      readOddleData.source = BookingSource.ODDLE;

      // if (data.trim() == "Cancelled Reservation") {
      //   readOddleData.status = data.replace(/(<([^>]+)>)/gi, "").trim();
      // }
      // if (data.trim() == "Edited Reservation") {
      //   readOddleData.status = data.replace(/(<([^>]+)>)/gi, "").trim();
      // }
    });
    return readOddleData;
  } catch (error) {
    Log.writeLog(
      Loglevel.ERROR,
      "readHtmlDataFromOddle",
      "ReadingMail",
      error,
      uniqueId
    );
  }
};
