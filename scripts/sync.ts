import { syncSheetsToDb } from "../lib/sheets";

syncSheetsToDb()
  .then(() => {
    console.log("sync done");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
