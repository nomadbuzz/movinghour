import { redirect } from "next/navigation";

import { Dashboard } from "@/components/dashboard/dashboard";
import { auth } from "@/lib/auth";
import { getEntries } from "@/lib/googleSheets";
import { getSessionEmail } from "@/lib/session";
import type { Entry } from "@/types/entry";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  const email = getSessionEmail(session);

  if (!email) {
    redirect("/login");
  }

  let initialEntries: Entry[] = [];

  try {
    initialEntries = await getEntries(email);
  } catch (error) {
    console.error("Failed to load initial entries:", error);
  }

  return <Dashboard initialEntries={initialEntries} />;
}
