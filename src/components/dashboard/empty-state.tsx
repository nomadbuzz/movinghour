import { ClipboardList } from "lucide-react";

import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  onAdd: () => void;
}

export function EmptyState({ onAdd }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-card px-6 py-16 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
        <ClipboardList className="size-6 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold">No entries yet</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Start tracking your moving jobs by adding your first entry.
      </p>
      <Button onClick={onAdd} className="mt-6">
        Add Entry
      </Button>
    </div>
  );
}
