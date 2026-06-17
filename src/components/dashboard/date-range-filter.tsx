"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  onApply: (startDate: string, endDate: string) => void;
  onClear: () => void;
}

export function DateRangeFilter({
  startDate,
  endDate,
  onApply,
  onClear,
}: DateRangeFilterProps) {
  const [localStart, setLocalStart] = useState(startDate);
  const [localEnd, setLocalEnd] = useState(endDate);

  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-card p-4 sm:flex-row sm:items-end">
      <div className="grid flex-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="start-date">Start Date</Label>
          <Input
            id="start-date"
            type="date"
            value={localStart}
            onChange={(event) => setLocalStart(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end-date">End Date</Label>
          <Input
            id="end-date"
            type="date"
            value={localEnd}
            onChange={(event) => setLocalEnd(event.target.value)}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          onClick={() => onApply(localStart, localEnd)}
          className="flex-1 sm:flex-none"
        >
          Apply
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setLocalStart("");
            setLocalEnd("");
            onClear();
          }}
          className="flex-1 sm:flex-none"
        >
          Clear
        </Button>
      </div>
    </div>
  );
}
