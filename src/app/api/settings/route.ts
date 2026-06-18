import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { getUserSettings, saveUserSettings } from "@/lib/settings";
import { getSessionEmail } from "@/lib/session";

const settingsSchema = z
  .object({
    hourlyRate: z.number().gt(0, "Hourly rate must be greater than 0").max(1000),
  })
  .strict();

export async function GET() {
  const session = await auth();
  const email = getSessionEmail(session);

  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settings = await getUserSettings(email);
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const session = await auth();
  const email = getSessionEmail(session);

  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = settingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid settings data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const settings = await saveUserSettings(email, parsed.data.hourlyRate);
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Failed to save settings:", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}
