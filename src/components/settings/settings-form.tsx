"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEFAULT_SETTINGS, type Settings } from "@/types/settings";

const settingsFormSchema = z.object({
  hourlyRate: z
    .number({ error: "Hourly rate is required" })
    .gt(0, "Hourly rate must be greater than 0")
    .max(1000, "Hourly rate cannot exceed 1000"),
  reviewBonus: z
    .number({ error: "Review bonus is required" })
    .gt(0, "Review bonus must be greater than 0")
    .max(1000, "Review bonus cannot exceed 1000"),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

const numberInputProps = {
  valueAsNumber: true,
  setValueAs: (value: string | number) => {
    const parsed = typeof value === "number" ? value : Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  },
} as const;

interface SettingsFormProps {
  initialSettings: Settings;
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      hourlyRate: initialSettings.hourlyRate || DEFAULT_SETTINGS.hourlyRate,
      reviewBonus: initialSettings.reviewBonus || DEFAULT_SETTINGS.reviewBonus,
    },
  });

  const onSubmit = async (values: SettingsFormValues) => {
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-2xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Customize how your earnings are calculated
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Earnings</CardTitle>
            <CardDescription>
              Your hourly rate applies to work and travel time. Review bonus is
              added per review.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    min={0.01}
                    max={1000}
                    step="0.01"
                    {...register("hourlyRate", numberInputProps)}
                  />
                  {errors.hourlyRate && (
                    <p className="text-sm text-destructive">
                      {errors.hourlyRate.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reviewBonus">Review Bonus ($)</Label>
                  <Input
                    id="reviewBonus"
                    type="number"
                    min={0.01}
                    max={1000}
                    step="0.01"
                    {...register("reviewBonus", numberInputProps)}
                  />
                  {errors.reviewBonus && (
                    <p className="text-sm text-destructive">
                      {errors.reviewBonus.message}
                    </p>
                  )}
                </div>
              </div>

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Settings"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
