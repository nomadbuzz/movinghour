import { redirect } from "next/navigation";

import { SettingsForm } from "@/components/settings/settings-form";
import { auth } from "@/lib/auth";
import { getUserSettings } from "@/lib/settings";
import { getSessionEmail } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  const email = getSessionEmail(session);

  if (!email) {
    redirect("/login");
  }

  let hourlyRate = 25;

  try {
    const settings = await getUserSettings(email);
    hourlyRate = settings.hourlyRate;
  } catch (error) {
    console.error("Failed to load settings:", error);
  }

  return <SettingsForm initialHourlyRate={hourlyRate} />;
}
