import { redirect } from "next/navigation";

import { Dashboard } from "@/components/dashboard/dashboard";
import { auth } from "@/lib/auth";
import { getEntries } from "@/lib/googleSheets";
import { getHourlyRate } from "@/lib/settings";
import { getSessionEmail } from "@/lib/session";
import type { Entry } from "@/types/entry";
import { DEFAULT_HOURLY_RATE } from "@/types/settings";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  const email = getSessionEmail(session);

  if (!email) {
    redirect("/login");
  }

  let initialEntries: Entry[] = [];
  let hourlyRate = DEFAULT_HOURLY_RATE;

  try {
    const [entries, rate] = await Promise.all([
      getEntries(email),
      getHourlyRate(email),
    ]);
    initialEntries = entries;
    hourlyRate = rate;
  } catch (error) {
    console.error("Failed to load dashboard data:", error);
  }

  return (
    <Dashboard initialEntries={initialEntries} hourlyRate={hourlyRate} />
  );
}
