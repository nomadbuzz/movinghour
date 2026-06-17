import { google } from "googleapis";

import type { Entry, EntryInput } from "@/types/entry";

const SHEET_NAME = "Jobs";
const DATA_RANGE = `${SHEET_NAME}!A2:G`;
const APPEND_RANGE = `${SHEET_NAME}!A:G`;
const HEADER_RANGE = `${SHEET_NAME}!A1:G1`;
const NEW_HEADERS = [
  "ID",
  "User Email",
  "Date",
  "Work Hours",
  "Travel Hours",
  "Reviews",
  "Tips",
];

function getSpreadsheetId(): string {
  const id = process.env.GOOGLE_SHEETS_ID;
  if (!id) {
    throw new Error("GOOGLE_SHEETS_ID is not configured");
  }
  return id;
}

function getSheetsClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!email || !privateKey) {
    throw new Error("Google service account credentials are not configured");
  }

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

function isEmail(value: string): boolean {
  return value.includes("@");
}

function looksLikeDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function rowToEntry(row: string[]): Entry | null {
  const [colA, colB, colC, colD, colE, colF, colG] = row;
  if (!colA) return null;

  if (isEmail(colB ?? "") || (colB === "" && looksLikeDate(colC ?? ""))) {
    if (!colC) return null;

    return {
      id: colA,
      userEmail: colB ?? "",
      date: colC,
      workHours: Number(colD) || 0,
      travelHours: Number(colE) || 0,
      reviews: Number(colF) || 0,
      tips: Number(colG) || 0,
    };
  }

  if (looksLikeDate(colB ?? "")) {
    return {
      id: colA,
      userEmail: "",
      date: colB,
      workHours: Number(colC) || 0,
      travelHours: Number(colD) || 0,
      reviews: Number(colE) || 0,
      tips: Number(colF) || 0,
    };
  }

  return null;
}

function entryToRow(entry: Entry): string[] {
  return [
    entry.id,
    entry.userEmail,
    entry.date,
    String(entry.workHours),
    String(entry.travelHours),
    String(entry.reviews),
    String(entry.tips),
  ];
}

function assertOwnership(entry: Entry | null, userEmail: string): asserts entry is Entry {
  if (!entry) {
    throw new Error("Entry not found");
  }

  if (!entry.userEmail || entry.userEmail !== userEmail) {
    throw new Error("Unauthorized");
  }
}

async function getSheetId(sheets: ReturnType<typeof getSheetsClient>): Promise<number> {
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: getSpreadsheetId(),
  });

  const sheet = spreadsheet.data.sheets?.find(
    (item) => item.properties?.title === SHEET_NAME
  );

  if (!sheet?.properties) {
    throw new Error(`Sheet "${SHEET_NAME}" not found`);
  }

  const sheetId = sheet.properties.sheetId;
  if (sheetId === undefined || sheetId === null) {
    throw new Error(`Sheet "${SHEET_NAME}" not found`);
  }

  return sheetId;
}

async function getHeaderRow(
  sheets: ReturnType<typeof getSheetsClient>
): Promise<string[]> {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: HEADER_RANGE,
  });

  return (response.data.values?.[0] as string[] | undefined) ?? [];
}

function hasUserEmailColumn(headers: string[]): boolean {
  return headers[1]?.toLowerCase().includes("email") ?? false;
}

async function getAllRows(
  sheets: ReturnType<typeof getSheetsClient>
): Promise<string[][]> {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: DATA_RANGE,
  });

  return (response.data.values as string[][] | undefined) ?? [];
}

export async function getEntries(userEmail: string): Promise<Entry[]> {
  const sheets = getSheetsClient();
  const rows = await getAllRows(sheets);

  return rows
    .map((row) => rowToEntry(row))
    .filter((entry): entry is Entry => entry !== null)
    .filter((entry) => entry.userEmail === userEmail)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function createEntry(
  input: EntryInput,
  userEmail: string
): Promise<Entry> {
  const sheets = getSheetsClient();
  const entry: Entry = {
    id: crypto.randomUUID(),
    userEmail,
    ...input,
  };

  await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range: APPEND_RANGE,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [entryToRow(entry)],
    },
  });

  return entry;
}

export async function updateEntry(
  id: string,
  input: EntryInput,
  userEmail: string
): Promise<Entry> {
  const sheets = getSheetsClient();
  const rows = await getAllRows(sheets);
  const rowIndex = rows.findIndex((row) => row[0] === id);

  if (rowIndex === -1) {
    throw new Error("Entry not found");
  }

  const existing = rowToEntry(rows[rowIndex]);
  assertOwnership(existing, userEmail);

  const updated: Entry = {
    id,
    userEmail: existing.userEmail,
    ...input,
  };
  const sheetRow = rowIndex + 2;

  await sheets.spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId(),
    range: `${SHEET_NAME}!A${sheetRow}:G${sheetRow}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [entryToRow(updated)],
    },
  });

  return updated;
}

export async function deleteEntry(id: string, userEmail: string): Promise<void> {
  const sheets = getSheetsClient();
  const rows = await getAllRows(sheets);
  const rowIndex = rows.findIndex((row) => row[0] === id);

  if (rowIndex === -1) {
    throw new Error("Entry not found");
  }

  const existing = rowToEntry(rows[rowIndex]);
  assertOwnership(existing, userEmail);

  const sheetId = await getSheetId(sheets);
  const sheetRow = rowIndex + 1;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: getSpreadsheetId(),
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: "ROWS",
              startIndex: sheetRow,
              endIndex: sheetRow + 1,
            },
          },
        },
      ],
    },
  });
}

export interface MigrationResult {
  migrated: boolean;
  rowsUpdated: number;
  message: string;
}

export async function migrateSheetToUserEmail(
  assignEmail: string
): Promise<MigrationResult> {
  if (!isEmail(assignEmail)) {
    throw new Error("A valid email address is required for migration");
  }

  const sheets = getSheetsClient();
  const headers = await getHeaderRow(sheets);

  if (hasUserEmailColumn(headers)) {
    const rows = await getAllRows(sheets);
    const rowsMissingEmail = rows.filter((row) => {
      const entry = rowToEntry(row);
      return entry !== null && !entry.userEmail;
    });

    if (rowsMissingEmail.length === 0) {
      return {
        migrated: false,
        rowsUpdated: 0,
        message: "Sheet already has a User Email column and all rows are assigned.",
      };
    }

    const updates = rowsMissingEmail.map((row) => {
      const rowIndex = rows.findIndex((candidate) => candidate[0] === row[0]);
      const sheetRow = rowIndex + 2;

      return {
        range: `${SHEET_NAME}!B${sheetRow}`,
        values: [[assignEmail]],
      };
    });

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: getSpreadsheetId(),
      requestBody: {
        valueInputOption: "USER_ENTERED",
        data: updates,
      },
    });

    return {
      migrated: true,
      rowsUpdated: rowsMissingEmail.length,
      message: `Assigned ${assignEmail} to ${rowsMissingEmail.length} row(s) missing a user email.`,
    };
  }

  const sheetId = await getSheetId(sheets);

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: getSpreadsheetId(),
    requestBody: {
      requests: [
        {
          insertDimension: {
            range: {
              sheetId,
              dimension: "COLUMNS",
              startIndex: 1,
              endIndex: 2,
            },
            inheritFromBefore: false,
          },
        },
      ],
    },
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId(),
    range: HEADER_RANGE,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [NEW_HEADERS],
    },
  });

  const rows = await getAllRows(sheets);

  if (rows.length > 0) {
    const validRows = rows
      .map((row) => {
        const [id, colB, colC, colD, colE, colF, colG] = row;
        if (!id) return null;

        if (isEmail(colB ?? "") || (colB === "" && looksLikeDate(colC ?? ""))) {
          return [
            id,
            assignEmail,
            colC ?? "",
            colD ?? "0",
            colE ?? "0",
            colF ?? "0",
            colG ?? "0",
          ];
        }

        if (looksLikeDate(colB ?? "")) {
          return [
            id,
            assignEmail,
            colB,
            colC ?? "0",
            colD ?? "0",
            colE ?? "0",
            colF ?? "0",
          ];
        }

        return null;
      })
      .filter((row): row is string[] => row !== null);

    await sheets.spreadsheets.values.update({
      spreadsheetId: getSpreadsheetId(),
      range: `${SHEET_NAME}!A2:G${rows.length + 1}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: validRows,
      },
    });
  }

  return {
    migrated: true,
    rowsUpdated: rows.length,
    message: `Inserted User Email column and assigned ${assignEmail} to ${rows.length} existing row(s).`,
  };
}
