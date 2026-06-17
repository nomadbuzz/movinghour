import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { deleteEntry, updateEntry } from "@/lib/googleSheets";
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

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  const session = await auth();
  const email = getSessionEmail(session);

  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const body = await request.json();
    const parsed = entrySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid entry data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const entry = await updateEntry(id, parsed.data, email);
    return NextResponse.json(entry);
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (isNotFoundError(error)) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    console.error("Failed to update entry:", error);
    return NextResponse.json(
      { error: "Failed to update entry" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await auth();
  const email = getSessionEmail(session);

  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    await deleteEntry(id, email);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (isNotFoundError(error)) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    console.error("Failed to delete entry:", error);
    return NextResponse.json(
      { error: "Failed to delete entry" },
      { status: 500 }
    );
  }
}
