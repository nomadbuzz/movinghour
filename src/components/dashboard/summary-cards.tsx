import { Clock, DollarSign, Gauge, MessageSquare, Wallet } from "lucide-react";

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
  hourlyRate: number;
}

export function SummaryCards({ entries, hourlyRate }: SummaryCardsProps) {
  const cards = [
    {
      key: "hourlyRate",
      title: "Hourly Rate",
      icon: Gauge,
      value: `${formatCurrency(hourlyRate)}/hr`,
    },
    {
      key: "earnings",
      title: "Total Earnings",
      icon: DollarSign,
      value: formatCurrency(calculateTotalEarnings(entries, hourlyRate)),
    },
    {
      key: "hours",
      title: "Total Hours",
      icon: Clock,
      value: calculateTotalHours(entries).toFixed(1),
    },
    {
      key: "reviews",
      title: "Total Reviews",
      icon: MessageSquare,
      value: String(calculateTotalReviews(entries)),
    },
    {
      key: "tips",
      title: "Total Tips",
      icon: Wallet,
      value: formatCurrency(calculateTotalTips(entries)),
    },
  ] as const;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map(({ key, title, icon: Icon, value }) => (
        <Card key={key}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
