"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { calculateEarnings } from "@/lib/calculations";
import { formatCurrency } from "@/lib/format";
import {
  decimalHoursToHoursMinutes,
  hoursMinutesToDecimalHours,
} from "@/lib/time";
import type { Entry } from "@/types/entry";
import type { Settings } from "@/types/settings";
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

const hoursField = z
  .number({ error: "Must be 0 or greater" })
  .min(0, "Must be 0 or greater")
  .int("Must be a whole number");

const minutesField = z
  .number({ error: "Must be between 0 and 59" })
  .min(0, "Must be between 0 and 59")
  .max(59, "Must be between 0 and 59")
  .int("Must be a whole number");

const nonNegativeField = z
  .number({ error: "Must be 0 or greater" })
  .min(0, "Must be 0 or greater");

const entryFormSchema = z.object({
  date: z.string().min(1, "Date is required"),
  workHours: hoursField,
  workMinutes: minutesField,
  travelHours: hoursField,
  travelMinutes: minutesField,
  reviews: nonNegativeField,
  tips: nonNegativeField,
});

const integerInputProps = {
  valueAsNumber: true,
  setValueAs: (value: string | number) => {
    const parsed = typeof value === "number" ? value : Number(value);
    return Number.isNaN(parsed) ? 0 : Math.trunc(parsed);
  },
} as const;

const decimalInputProps = {
  valueAsNumber: true,
  setValueAs: (value: string | number) => {
    const parsed = typeof value === "number" ? value : Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  },
} as const;

type EntryFormValues = z.infer<typeof entryFormSchema>;

export interface EntrySubmitValues {
  date: string;
  workHours: number;
  travelHours: number;
  reviews: number;
  tips: number;
}

interface EntryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: Entry | null;
  settings: Pick<Settings, "hourlyRate" | "reviewBonus">;
  onSubmit: (values: EntrySubmitValues) => Promise<void>;
  isSubmitting: boolean;
}

const defaultValues: EntryFormValues = {
  date: new Date().toISOString().split("T")[0],
  workHours: 0,
  workMinutes: 0,
  travelHours: 0,
  travelMinutes: 0,
  reviews: 0,
  tips: 0,
};

function entryToFormValues(entry: Entry): EntryFormValues {
  const work = decimalHoursToHoursMinutes(entry.workHours);
  const travel = decimalHoursToHoursMinutes(entry.travelHours);

  return {
    date: entry.date,
    workHours: work.hours,
    workMinutes: work.minutes,
    travelHours: travel.hours,
    travelMinutes: travel.minutes,
    reviews: entry.reviews,
    tips: entry.tips,
  };
}

export function EntryFormDialog({
  open,
  onOpenChange,
  entry,
  settings,
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
    hoursMinutesToDecimalHours(
      Number(watched.workHours) || 0,
      Number(watched.workMinutes) || 0
    ),
    hoursMinutesToDecimalHours(
      Number(watched.travelHours) || 0,
      Number(watched.travelMinutes) || 0
    ),
    Number(watched.reviews) || 0,
    Number(watched.tips) || 0,
    settings
  );

  useEffect(() => {
    if (open) {
      reset(entry ? entryToFormValues(entry) : defaultValues);
    }
  }, [open, entry, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{entry ? "Edit Entry" : "Add Entry"}</DialogTitle>
          <DialogDescription>
            Track work time, travel time, reviews, and tips for a job.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(async (values) => {
            await onSubmit({
              date: values.date,
              workHours: hoursMinutesToDecimalHours(
                values.workHours,
                values.workMinutes
              ),
              travelHours: hoursMinutesToDecimalHours(
                values.travelHours,
                values.travelMinutes
              ),
              reviews: values.reviews,
              tips: values.tips,
            });
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

          <div className="space-y-3">
            <p className="text-sm font-medium">Work Time</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="workHours">Hours</Label>
                <Input
                  id="workHours"
                  type="number"
                  min={0}
                  step="1"
                  {...register("workHours", integerInputProps)}
                />
                {errors.workHours && (
                  <p className="text-sm text-destructive">
                    {errors.workHours.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="workMinutes">Minutes</Label>
                <Input
                  id="workMinutes"
                  type="number"
                  min={0}
                  max={59}
                  step="1"
                  {...register("workMinutes", integerInputProps)}
                />
                {errors.workMinutes && (
                  <p className="text-sm text-destructive">
                    {errors.workMinutes.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">Travel Time</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="travelHours">Hours</Label>
                <Input
                  id="travelHours"
                  type="number"
                  min={0}
                  step="1"
                  {...register("travelHours", integerInputProps)}
                />
                {errors.travelHours && (
                  <p className="text-sm text-destructive">
                    {errors.travelHours.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="travelMinutes">Minutes</Label>
                <Input
                  id="travelMinutes"
                  type="number"
                  min={0}
                  max={59}
                  step="1"
                  {...register("travelMinutes", integerInputProps)}
                />
                {errors.travelMinutes && (
                  <p className="text-sm text-destructive">
                    {errors.travelMinutes.message}
                  </p>
                )}
              </div>
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
                {...register("reviews", integerInputProps)}
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
                {...register("tips", decimalInputProps)}
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
