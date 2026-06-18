"use client";

import { LayoutDashboard, LogOut, Settings, Truck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants, Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function Header() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Truck className="size-5" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold leading-none">Moving Earnings</p>
              <p className="text-xs text-muted-foreground">Tracker</p>
            </div>
          </div>

          <nav className="flex items-center gap-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  buttonVariants({
                    variant: pathname === href ? "secondary" : "ghost",
                    size: "sm",
                  }),
                  pathname === href && "font-medium"
                )}
              >
                <Icon className="size-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <Separator orientation="vertical" className="hidden h-6 sm:block" />
          {status === "loading" ? (
            <Skeleton className="h-8 w-28" />
          ) : (
            <>
              <span className="hidden max-w-[180px] truncate text-sm text-muted-foreground md:inline">
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
