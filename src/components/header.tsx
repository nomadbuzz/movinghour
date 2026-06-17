"use client";

import { LogOut, Truck } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export function Header() {
  const { data: session, status } = useSession();

  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Truck className="size-5" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">Moving Earnings</p>
            <p className="text-xs text-muted-foreground">Tracker</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <Separator orientation="vertical" className="hidden h-6 sm:block" />
          {status === "loading" ? (
            <Skeleton className="h-8 w-28" />
          ) : (
            <>
              <span className="hidden max-w-[180px] truncate text-sm text-muted-foreground sm:inline">
                {session?.user?.email}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut className="size-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
