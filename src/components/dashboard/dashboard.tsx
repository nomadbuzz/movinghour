"use client";

import { Plus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { DateRangeFilter } from "@/components/dashboard/date-range-filter";
import { DeleteEntryDialog } from "@/components/dashboard/delete-entry-dialog";
import { EmptyState } from "@/components/dashboard/empty-state";
import { EntriesTable } from "@/components/dashboard/entries-table";
import { EntryFormDialog } from "@/components/dashboard/entry-form-dialog";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import type { Entry } from "@/types/entry";

interface DashboardProps {
  initialEntries: Entry[];
}

export function Dashboard({ initialEntries }: DashboardProps) {
  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [isLoading, setIsLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<Entry | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchEntries = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/entries");
      if (!response.ok) {
        throw new Error("Failed to fetch entries");
      }
      const data = (await response.json()) as Entry[];
      setEntries(data);
    } catch {
      toast.error("Failed to load entries");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (startDate && entry.date < startDate) return false;
      if (endDate && entry.date > endDate) return false;
      return true;
    });
  }, [entries, startDate, endDate]);

  const handleSave = async (values: {
    date: string;
    workHours: number;
    travelHours: number;
    reviews: number;
    tips: number;
  }) => {
    setIsSubmitting(true);
    try {
      const isEditing = !!editingEntry;
      const response = await fetch(
        isEditing ? `/api/entries/${editingEntry.id}` : "/api/entries",
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        }
      );

      if (!response.ok) {
        throw new Error(isEditing ? "Failed to update entry" : "Failed to create entry");
      }

      await fetchEntries();
      setFormOpen(false);
      setEditingEntry(null);
      toast.success(isEditing ? "Entry updated" : "Entry saved");
    } catch {
      toast.error(editingEntry ? "Failed to update entry" : "Failed to save entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingEntry) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/entries/${deletingEntry.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete entry");
      }

      await fetchEntries();
      setDeletingEntry(null);
      toast.success("Entry deleted");
    } catch {
      toast.error("Failed to delete entry");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Track your moving jobs and earnings
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingEntry(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" />
            Add Entry
          </Button>
        </div>

        {isLoading ? (
          <DashboardSkeleton />
        ) : (
          <>
            <SummaryCards entries={filteredEntries} />

            <DateRangeFilter
              startDate={startDate}
              endDate={endDate}
              onApply={(start, end) => {
                setStartDate(start);
                setEndDate(end);
              }}
              onClear={() => {
                setStartDate("");
                setEndDate("");
              }}
            />

            {filteredEntries.length === 0 ? (
              <EmptyState
                onAdd={() => {
                  setEditingEntry(null);
                  setFormOpen(true);
                }}
              />
            ) : (
              <EntriesTable
                entries={filteredEntries}
                onEdit={(entry) => {
                  setEditingEntry(entry);
                  setFormOpen(true);
                }}
                onDelete={setDeletingEntry}
              />
            )}
          </>
        )}
      </main>

      <EntryFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingEntry(null);
        }}
        entry={editingEntry}
        onSubmit={handleSave}
        isSubmitting={isSubmitting}
      />

      <DeleteEntryDialog
        entry={deletingEntry}
        open={!!deletingEntry}
        onOpenChange={(open) => {
          if (!open) setDeletingEntry(null);
        }}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
