"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { calculateEarnings } from "@/lib/calculations";
import { formatCurrency } from "@/lib/format";
import type { Entry } from "@/types/entry";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const numberField = z
  .number({ error: "Must be 0 or greater" })
  .min(0, "Must be 0 or greater");

const entryFormSchema = z.object({
  date: z.string().min(1, "Date is required"),
  workHours: numberField,
  travelHours: numberField,
  reviews: numberField,
  tips: numberField,
});

const numberInputProps = {
  valueAsNumber: true,
  setValueAs: (value: string | number) => {
    const parsed = typeof value === "number" ? value : Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  },
} as const;

type EntryFormValues = z.infer<typeof entryFormSchema>;

interface EntryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: Entry | null;
  onSubmit: (values: EntryFormValues) => Promise<void>;
  isSubmitting: boolean;
}

const defaultValues: EntryFormValues = {
  date: new Date().toISOString().split("T")[0],
  workHours: 0,
  travelHours: 0,
  reviews: 0,
  tips: 0,
};

export function EntryFormDialog({
  open,
  onOpenChange,
  entry,
  onSubmit,
  isSubmitting,
}: EntryFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<EntryFormValues>({
    resolver: zodResolver(entryFormSchema),
    defaultValues,
  });

  const watched = useWatch({ control });
  const previewEarnings = calculateEarnings(
    Number(watched.workHours) || 0,
    Number(watched.travelHours) || 0,
    Number(watched.reviews) || 0,
    Number(watched.tips) || 0
  );

  useEffect(() => {
    if (open) {
      reset(
        entry
          ? {
              date: entry.date,
              workHours: entry.workHours,
              travelHours: entry.travelHours,
              reviews: entry.reviews,
              tips: entry.tips,
            }
          : defaultValues
      );
    }
  }, [open, entry, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{entry ? "Edit Entry" : "Add Entry"}</DialogTitle>
          <DialogDescription>
            Track work hours, travel, reviews, and tips for a job.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(async (values) => {
            await onSubmit(values);
          })}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" {...register("date")} />
            {errors.date && (
              <p className="text-sm text-destructive">{errors.date.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="workHours">Work Hours</Label>
              <Input
                id="workHours"
                type="number"
                min={0}
                step="0.5"
                {...register("workHours", numberInputProps)}
              />
              {errors.workHours && (
                <p className="text-sm text-destructive">
                  {errors.workHours.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="travelHours">Travel Hours</Label>
              <Input
                id="travelHours"
                type="number"
                min={0}
                step="0.5"
                {...register("travelHours", numberInputProps)}
              />
              {errors.travelHours && (
                <p className="text-sm text-destructive">
                  {errors.travelHours.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reviews">Reviews</Label>
              <Input
                id="reviews"
                type="number"
                min={0}
                step="1"
                {...register("reviews", numberInputProps)}
              />
              {errors.reviews && (
                <p className="text-sm text-destructive">
                  {errors.reviews.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="tips">Tips ($)</Label>
              <Input
                id="tips"
                type="number"
                min={0}
                step="0.01"
                {...register("tips", numberInputProps)}
              />
              {errors.tips && (
                <p className="text-sm text-destructive">{errors.tips.message}</p>
              )}
            </div>
          </div>

          <div className="rounded-lg bg-muted px-4 py-3">
            <p className="text-sm text-muted-foreground">Estimated earnings</p>
            <p className="text-xl font-semibold">
              {formatCurrency(previewEarnings)}
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : entry ? "Update" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
