import { redirect } from "next/navigation";

import { SettingsForm } from "@/components/settings/settings-form";
import { auth } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { getSessionEmail } from "@/lib/session";
import { DEFAULT_SETTINGS } from "@/types/settings";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  const email = getSessionEmail(session);

  if (!email) {
    redirect("/login");
  }

  let settings = DEFAULT_SETTINGS;

  try {
    settings = await getSettings(email);
  } catch (error) {
    console.error("Failed to load settings:", error);
  }

  return <SettingsForm initialSettings={settings} />;
}
