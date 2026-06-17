"use client";

import { Pencil, Trash2 } from "lucide-react";

import { calculateEntryEarnings } from "@/lib/calculations";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Entry } from "@/types/entry";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface EntriesTableProps {
  entries: Entry[];
  onEdit: (entry: Entry) => void;
  onDelete: (entry: Entry) => void;
}

export function EntriesTable({ entries, onEdit, onDelete }: EntriesTableProps) {
  return (
    <>
      <div className="hidden rounded-lg border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Work Hrs</TableHead>
              <TableHead className="text-right">Travel Hrs</TableHead>
              <TableHead className="text-right">Reviews</TableHead>
              <TableHead className="text-right">Tips</TableHead>
              <TableHead className="text-right">Daily Earnings</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="font-medium">
                  {formatDate(entry.date)}
                </TableCell>
                <TableCell className="text-right">{entry.workHours}</TableCell>
                <TableCell className="text-right">{entry.travelHours}</TableCell>
                <TableCell className="text-right">{entry.reviews}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(entry.tips)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(calculateEntryEarnings(entry))}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onEdit(entry)}
                      aria-label="Edit entry"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onDelete(entry)}
                      aria-label="Delete entry"
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-4 md:hidden">
        {entries.map((entry) => (
          <Card key={entry.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {formatDate(entry.date)}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Work Hrs</p>
                <p className="font-medium">{entry.workHours}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Travel Hrs</p>
                <p className="font-medium">{entry.travelHours}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Reviews</p>
                <p className="font-medium">{entry.reviews}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Tips</p>
                <p className="font-medium">{formatCurrency(entry.tips)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground">Daily Earnings</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(calculateEntryEarnings(entry))}
                </p>
              </div>
            </CardContent>
            <CardFooter className="gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onEdit(entry)}
              >
                <Pencil className="size-4" />
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="flex-1"
                onClick={() => onDelete(entry)}
              >
                <Trash2 className="size-4" />
                Delete
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </>
  );
}
