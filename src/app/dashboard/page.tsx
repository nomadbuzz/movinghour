import { Dashboard } from "@/components/dashboard/dashboard";
import { getEntries } from "@/lib/googleSheets";
import type { Entry } from "@/types/entry";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let initialEntries: Entry[] = [];

  try {
    initialEntries = await getEntries();
  } catch (error) {
    console.error("Failed to load initial entries:", error);
  }

  return <Dashboard initialEntries={initialEntries} />;
}
