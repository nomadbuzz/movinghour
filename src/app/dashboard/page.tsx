import { redirect } from "next/navigation";

import { Dashboard } from "@/components/dashboard/dashboard";
import { auth } from "@/lib/auth";
import { getEntries } from "@/lib/googleSheets";
import { getSettings } from "@/lib/settings";
import { getSessionEmail } from "@/lib/session";
import type { Entry } from "@/types/entry";
import { DEFAULT_SETTINGS } from "@/types/settings";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  const email = getSessionEmail(session);

  if (!email) {
    redirect("/login");
  }

  let initialEntries: Entry[] = [];
  let settings = DEFAULT_SETTINGS;

  try {
    const [entries, userSettings] = await Promise.all([
      getEntries(email),
      getSettings(email),
    ]);
    initialEntries = entries;
    settings = userSettings;
  } catch (error) {
    console.error("Failed to load dashboard data:", error);
  }

  return <Dashboard initialEntries={initialEntries} settings={settings} />;
}
