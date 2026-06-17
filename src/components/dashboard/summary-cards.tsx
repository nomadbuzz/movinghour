import { Clock, DollarSign, MessageSquare, Wallet } from "lucide-react";

import {
  calculateTotalEarnings,
  calculateTotalHours,
  calculateTotalReviews,
  calculateTotalTips,
} from "@/lib/calculations";
import { formatCurrency } from "@/lib/format";
import type { Entry } from "@/types/entry";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SummaryCardsProps {
  entries: Entry[];
}

const cards = [
  {
    key: "earnings",
    title: "Total Earnings",
    icon: DollarSign,
    getValue: (entries: Entry[]) => formatCurrency(calculateTotalEarnings(entries)),
  },
  {
    key: "hours",
    title: "Total Hours",
    icon: Clock,
    getValue: (entries: Entry[]) => calculateTotalHours(entries).toFixed(1),
  },
  {
    key: "reviews",
    title: "Total Reviews",
    icon: MessageSquare,
    getValue: (entries: Entry[]) => String(calculateTotalReviews(entries)),
  },
  {
    key: "tips",
    title: "Total Tips",
    icon: Wallet,
    getValue: (entries: Entry[]) => formatCurrency(calculateTotalTips(entries)),
  },
] as const;

export function SummaryCards({ entries }: SummaryCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ key, title, icon: Icon, getValue }) => (
        <Card key={key}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tracking-tight">{getValue(entries)}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
