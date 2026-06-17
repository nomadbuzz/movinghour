import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { createEntry, getEntries } from "@/lib/googleSheets";
import {
  getSessionEmail,
  isNotFoundError,
  isUnauthorizedError,
} from "@/lib/session";

const entrySchema = z
  .object({
    date: z.string().min(1),
    workHours: z.number().min(0),
    travelHours: z.number().min(0),
    reviews: z.number().min(0),
    tips: z.number().min(0),
  })
  .strict();

export async function GET() {
  const session = await auth();
  const email = getSessionEmail(session);

  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const entries = await getEntries(email);
    return NextResponse.json(entries);
  } catch (error) {
    console.error("Failed to fetch entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch entries" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();
  const email = getSessionEmail(session);

  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = entrySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid entry data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const entry = await createEntry(parsed.data, email);
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    if (isUnauthorizedError(error) || isNotFoundError(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    console.error("Failed to create entry:", error);
    return NextResponse.json(
      { error: "Failed to create entry" },
      { status: 500 }
    );
  }
}
