import { google } from "googleapis";

import {
  DEFAULT_SETTINGS,
  type Settings,
} from "@/types/settings";

const SETTINGS_SHEET = "Settings";
const SETTINGS_DATA_RANGE = `${SETTINGS_SHEET}!A2:B`;
const SETTINGS_HEADER_RANGE = `${SETTINGS_SHEET}!A1:B1`;
const KEY_VALUE_HEADERS = ["Key", "Value"];
const LEGACY_HEADERS = ["User Email", "Hourly Rate"];

const SETTING_KEYS = ["hourlyRate", "reviewBonus"] as const;

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

function scopedKey(userEmail: string, key: (typeof SETTING_KEYS)[number]): string {
  return `${userEmail}::${key}`;
}

function parsePositiveNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

async function getHeaderRow(
  sheets: ReturnType<typeof getSheetsClient>
): Promise<string[]> {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: getSpreadsheetId(),
      range: SETTINGS_HEADER_RANGE,
    });

    return (response.data.values?.[0] as string[] | undefined) ?? [];
  } catch {
    return [];
  }
}

function isLegacyFormat(headers: string[]): boolean {
  return headers[0] === LEGACY_HEADERS[0] && headers[1] === LEGACY_HEADERS[1];
}

function isKeyValueFormat(headers: string[]): boolean {
  return headers[0] === KEY_VALUE_HEADERS[0] && headers[1] === KEY_VALUE_HEADERS[1];
}

async function ensureKeyValueHeaders(
  sheets: ReturnType<typeof getSheetsClient>
): Promise<void> {
  const headers = await getHeaderRow(sheets);

  if (isKeyValueFormat(headers)) {
    return;
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId(),
    range: SETTINGS_HEADER_RANGE,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [KEY_VALUE_HEADERS],
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

function readLegacySettings(
  rows: string[][],
  userEmail: string
): Settings | null {
  const row = rows.find(([email]) => email === userEmail);
  if (!row) return null;

  return {
    hourlyRate: parsePositiveNumber(row[1], DEFAULT_SETTINGS.hourlyRate),
    reviewBonus: DEFAULT_SETTINGS.reviewBonus,
  };
}

function readKeyValueSettings(
  rows: string[][],
  userEmail: string
): Settings {
  const settings: Settings = { ...DEFAULT_SETTINGS };

  for (const key of SETTING_KEYS) {
    const scoped = scopedKey(userEmail, key);
    const row = rows.find(([rowKey]) => rowKey === scoped);
    if (row) {
      settings[key] = parsePositiveNumber(row[1], DEFAULT_SETTINGS[key]);
    }
  }

  return settings;
}

export async function getSettings(userEmail: string): Promise<Settings> {
  const sheets = getSheetsClient();

  try {
    const headers = await getHeaderRow(sheets);
    const rows = await getAllSettingsRows(sheets);

    if (rows.length === 0 && !isKeyValueFormat(headers) && !isLegacyFormat(headers)) {
      return { ...DEFAULT_SETTINGS };
    }

    if (isLegacyFormat(headers)) {
      return readLegacySettings(rows, userEmail) ?? { ...DEFAULT_SETTINGS };
    }

    if (!isKeyValueFormat(headers)) {
      await ensureKeyValueHeaders(sheets);
    }

    return readKeyValueSettings(rows, userEmail);
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(
  userEmail: string,
  settings: Settings
): Promise<Settings> {
  const sheets = getSheetsClient();
  await ensureKeyValueHeaders(sheets);

  const headers = await getHeaderRow(sheets);

  if (isLegacyFormat(headers)) {
    await sheets.spreadsheets.values.clear({
      spreadsheetId: getSpreadsheetId(),
      range: SETTINGS_DATA_RANGE,
    });
  }

  const currentRows = isLegacyFormat(headers)
    ? []
    : await getAllSettingsRows(sheets);

  const updates: Array<{ range: string; values: string[][] }> = [];

  for (const key of SETTING_KEYS) {
    const fullKey = scopedKey(userEmail, key);
    const rowIndex = currentRows.findIndex(([rowKey]) => rowKey === fullKey);
    const value = String(settings[key]);

    if (rowIndex === -1) {
      await sheets.spreadsheets.values.append({
        spreadsheetId: getSpreadsheetId(),
        range: `${SETTINGS_SHEET}!A:B`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [[fullKey, value]],
        },
      });
      currentRows.push([fullKey, value]);
    } else {
      const sheetRow = rowIndex + 2;
      updates.push({
        range: `${SETTINGS_SHEET}!B${sheetRow}`,
        values: [[value]],
      });
    }
  }

  if (updates.length > 0) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: getSpreadsheetId(),
      requestBody: {
        valueInputOption: "USER_ENTERED",
        data: updates,
      },
    });
  }

  return settings;
}
