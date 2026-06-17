import { config } from "dotenv";
import { resolve } from "path";

import { migrateSheetToUserEmail } from "../src/lib/googleSheets";

config({ path: resolve(process.cwd(), ".env.local") });

async function main() {
  const assignEmail = process.argv[2];

  if (!assignEmail) {
    console.error("Usage: npm run migrate-sheet -- user@example.com");
    process.exit(1);
  }

  console.log(`Migrating sheet and assigning rows to: ${assignEmail}`);

  const result = await migrateSheetToUserEmail(assignEmail);

  console.log(result.message);
  console.log(`Rows updated: ${result.rowsUpdated}`);
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
