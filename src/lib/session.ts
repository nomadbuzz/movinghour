import type { Session } from "next-auth";

export function getSessionEmail(session: Session | null): string | null {
  return session?.user?.email ?? null;
}

export function requireSessionEmail(session: Session | null): string {
  const email = getSessionEmail(session);
  if (!email) {
    throw new Error("Unauthorized");
  }
  return email;
}

export function isUnauthorizedError(error: unknown): boolean {
  return error instanceof Error && error.message === "Unauthorized";
}

export function isNotFoundError(error: unknown): boolean {
  return error instanceof Error && error.message === "Entry not found";
}
