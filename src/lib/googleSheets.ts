import { google } from "googleapis";

import type { Entry, EntryInput } from "@/types/entry";

const SHEET_NAME = "Jobs";

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

function rowToEntry(row: string[]): Entry | null {
  const [id, date, workHours, travelHours, reviews, tips] = row;
  if (!id || !date) return null;

  return {
    id,
    date,
    workHours: Number(workHours) || 0,
    travelHours: Number(travelHours) || 0,
    reviews: Number(reviews) || 0,
    tips: Number(tips) || 0,
  };
}

function entryToRow(entry: Entry): string[] {
  return [
    entry.id,
    entry.date,
    String(entry.workHours),
    String(entry.travelHours),
    String(entry.reviews),
    String(entry.tips),
  ];
}

async function getSheetId(sheets: ReturnType<typeof getSheetsClient>): Promise<number> {
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: getSpreadsheetId(),
  });

  const sheet = spreadsheet.data.sheets?.find(
    (item) => item.properties?.title === SHEET_NAME
  );

  if (!sheet?.properties?.sheetId && sheet?.properties?.sheetId !== 0) {
    throw new Error(`Sheet "${SHEET_NAME}" not found`);
  }

  return sheet.properties.sheetId;
}

export async function getEntries(): Promise<Entry[]> {
  const sheets = getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: `${SHEET_NAME}!A2:F`,
  });

  const rows = response.data.values ?? [];

  return rows
    .map((row) => rowToEntry(row as string[]))
    .filter((entry): entry is Entry => entry !== null)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function createEntry(input: EntryInput): Promise<Entry> {
  const sheets = getSheetsClient();
  const entry: Entry = {
    id: crypto.randomUUID(),
    ...input,
  };

  await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range: `${SHEET_NAME}!A:F`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [entryToRow(entry)],
    },
  });

  return entry;
}

export async function updateEntry(
  id: string,
  input: EntryInput
): Promise<Entry | null> {
  const sheets = getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: `${SHEET_NAME}!A2:F`,
  });

  const rows = response.data.values ?? [];
  const rowIndex = rows.findIndex((row) => row[0] === id);

  if (rowIndex === -1) return null;

  const updated: Entry = { id, ...input };
  const sheetRow = rowIndex + 2;

  await sheets.spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId(),
    range: `${SHEET_NAME}!A${sheetRow}:F${sheetRow}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [entryToRow(updated)],
    },
  });

  return updated;
}

export async function deleteEntry(id: string): Promise<boolean> {
  const sheets = getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: `${SHEET_NAME}!A2:F`,
  });

  const rows = response.data.values ?? [];
  const rowIndex = rows.findIndex((row) => row[0] === id);

  if (rowIndex === -1) return false;

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

  return true;
}
