import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

type Session = NonNullable<Awaited<ReturnType<typeof auth>>>;

/** Require an authenticated ADMIN. Mirrors api/admin/whitelist/route.ts. */
export async function requireAdmin(): Promise<
  { session: Session; error?: undefined } | { session?: undefined; error: NextResponse }
> {
  const session = await auth();
  if (!session?.user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (session.user.role !== "ADMIN")
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { session };
}

/** Require an authenticated TEAM or ADMIN member. */
export async function requireTeam(): Promise<
  { session: Session; error?: undefined } | { session?: undefined; error: NextResponse }
> {
  const session = await auth();
  if (!session?.user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (session.user.role !== "TEAM" && session.user.role !== "ADMIN")
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { session };
}
