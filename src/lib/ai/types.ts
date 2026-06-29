import type { z } from "zod";
import type { PrismaClient } from "@prisma/client";
import type { Session } from "next-auth";

/** Server-side context handed to a skill's optional prepare() step. */
export type PrepareArgs = {
  clientInput: unknown;
  prisma: PrismaClient;
  session: Session;
  today: Date;
};

/**
 * An AI skill: a prompt template + I/O schemas + a deterministic fallback.
 * Adding a skill = one file implementing this interface + a registry entry.
 */
export interface AiSkill<I, O> {
  /** Stable identifier used in POST /api/ai/run { skill }. */
  name: string;
  /** Minimum role allowed to run this skill. */
  role: "ADMIN" | "TEAM";
  inputSchema: z.ZodType<I>;
  outputSchema: z.ZodType<O>;
  temperature?: number;
  /** Optional: assemble extra input server-side (DB reads). Merged over client input, then validated. */
  prepare?(args: PrepareArgs): Promise<Record<string, unknown>>;
  buildMessages(input: I): { system: string; user: string };
  /** Deterministic, no-network result used when DeepSeek is absent or fails. */
  fallback(input: I): O;
}
