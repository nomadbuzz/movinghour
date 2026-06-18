import { google } from "googleapis";

import {
  DEFAULT_HOURLY_RATE,
  type UserSettings,
} from "@/types/settings";

const SETTINGS_SHEET = "Settings";
const SETTINGS_DATA_RANGE = `${SETTINGS_SHEET}!A2:B`;
const SETTINGS_HEADER_RANGE = `${SETTINGS_SHEET}!A1:B1`;
const SETTINGS_HEADERS = ["User Email", "Hourly Rate"];

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

async function ensureSettingsHeaders(
  sheets: ReturnType<typeof getSheetsClient>
): Promise<void> {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: SETTINGS_HEADER_RANGE,
  });

  const headers = response.data.values?.[0];
  if (headers?.[0] === SETTINGS_HEADERS[0]) {
    return;
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId(),
    range: SETTINGS_HEADER_RANGE,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [SETTINGS_HEADERS],
    },
  });
}

async function getAllSettingsRows(
  sheets: ReturnType<typeof getSheetsClient>
): Promise<string[][]> {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: SETTINGS_DATA_RANGE,
  });

  return (response.data.values as string[][] | undefined) ?? [];
}

export async function getUserSettings(userEmail: string): Promise<UserSettings> {
  const sheets = getSheetsClient();

  try {
    const rows = await getAllSettingsRows(sheets);
    const row = rows.find(([email]) => email === userEmail);

    if (!row) {
      return { hourlyRate: DEFAULT_HOURLY_RATE };
    }

    const hourlyRate = Number(row[1]);
    if (!Number.isFinite(hourlyRate) || hourlyRate <= 0) {
      return { hourlyRate: DEFAULT_HOURLY_RATE };
    }

    return { hourlyRate };
  } catch {
    return { hourlyRate: DEFAULT_HOURLY_RATE };
  }
}

export async function getHourlyRate(userEmail: string): Promise<number> {
  const settings = await getUserSettings(userEmail);
  return settings.hourlyRate;
}

export async function saveUserSettings(
  userEmail: string,
  hourlyRate: number
): Promise<UserSettings> {
  const sheets = getSheetsClient();
  await ensureSettingsHeaders(sheets);

  const rows = await getAllSettingsRows(sheets);
  const rowIndex = rows.findIndex(([email]) => email === userEmail);

  if (rowIndex === -1) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: getSpreadsheetId(),
      range: `${SETTINGS_SHEET}!A:B`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[userEmail, String(hourlyRate)]],
      },
    });
  } else {
    const sheetRow = rowIndex + 2;
    await sheets.spreadsheets.values.update({
      spreadsheetId: getSpreadsheetId(),
      range: `${SETTINGS_SHEET}!A${sheetRow}:B${sheetRow}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[userEmail, String(hourlyRate)]],
      },
    });
  }

  return { hourlyRate };
}
