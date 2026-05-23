import { z } from "zod";

export const REASON_OPTIONS = ["price", "quality", "unused", "found_better", "other"] as const;
export const MOOD_OPTIONS = ["1", "2", "3", "4", "5"] as const;
export const TRIAL_STATUS_OPTIONS = ["active", "cancelled", "converted"] as const;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const cancellationCreateSchema = z.object({
  serviceName: z.string().trim().min(1).max(120),
  cancelDate: z.string().regex(DATE_RE, "expected YYYY-MM-DD"),
  monthlyCostSaved: z.union([z.string(), z.number(), z.null()]).optional(),
  reason: z.enum(REASON_OPTIONS),
  reasonNotes: z.string().trim().max(2000).optional().nullable(),
  mood: z.enum(MOOD_OPTIONS),
});

export const cancellationUpdateSchema = cancellationCreateSchema;

export const trialCreateSchema = z.object({
  serviceName: z.string().trim().min(1).max(120),
  trialStartDate: z.string().regex(DATE_RE, "expected YYYY-MM-DD"),
  trialConversionDate: z.string().regex(DATE_RE, "expected YYYY-MM-DD"),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const trialUpdateSchema = z.object({
  serviceName: z.string().trim().min(1).max(120),
  trialStartDate: z.string().regex(DATE_RE, "expected YYYY-MM-DD"),
  trialConversionDate: z.string().regex(DATE_RE, "expected YYYY-MM-DD"),
  notes: z.string().trim().max(2000).optional().nullable(),
  status: z.enum(TRIAL_STATUS_OPTIONS),
});

export const trialTransitionSchema = z.object({
  status: z.enum(["cancelled", "converted"]),
});

export const notificationPrefsSchema = z.object({
  emailEnabled: z.boolean(),
  reminderDaysBefore: z.union([z.string(), z.number()]).transform((v) => {
    const n = typeof v === "string" ? Number(v) : v;
    if (!Number.isFinite(n)) throw new Error("reminderDaysBefore must be a number");
    return Math.max(1, Math.min(60, Math.round(n)));
  }),
});

export type CancellationCreateInput = z.infer<typeof cancellationCreateSchema>;
export type TrialCreateInput = z.infer<typeof trialCreateSchema>;
export type TrialUpdateInput = z.infer<typeof trialUpdateSchema>;
export type NotificationPrefsInput = z.infer<typeof notificationPrefsSchema>;

export function normalizeMonthlyCost(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return null;
  if (n < 0) return null;
  return n.toFixed(2);
}
