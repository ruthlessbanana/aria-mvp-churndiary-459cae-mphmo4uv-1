import { getDbPool } from "@/lib/db";
import { okJson } from "@/lib/server/api/json-response";
import { parseJsonBody } from "@/lib/server/api/parse-body";
import { requireSession } from "@/lib/server/api/require-session";
import { withApiErrorHandling } from "@/lib/server/api/with-api-error-handling";
import { notificationPrefsSchema } from "@/features/churn-diary/shared/schemas";
import { getNotificationPrefs } from "@/features/churn-diary/server/queries";

export const runtime = "nodejs";

export const GET = withApiErrorHandling(async () => {
  const { user } = await requireSession();
  const row = await getNotificationPrefs(user.id);
  return okJson({
    preferences: {
      emailEnabled: row?.email_enabled ?? true,
      reminderDaysBefore: row?.reminder_days_before ?? 7,
    },
  });
});

export const POST = withApiErrorHandling(async (req) => {
  const { user } = await requireSession();
  const body = await parseJsonBody(req, notificationPrefsSchema);

  const pool = getDbPool();
  const { rows } = await pool.query<{
    email_enabled: boolean;
    reminder_days_before: number;
  }>(
    `INSERT INTO "notification_preferences" (user_id, email_enabled, reminder_days_before)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id) DO UPDATE
       SET email_enabled = excluded.email_enabled,
           reminder_days_before = excluded.reminder_days_before,
           updated_at = now()
     RETURNING email_enabled, reminder_days_before`,
    [user.id, body.emailEnabled, body.reminderDaysBefore],
  );
  const row = rows[0];
  return okJson({
    preferences: {
      emailEnabled: row?.email_enabled ?? body.emailEnabled,
      reminderDaysBefore: row?.reminder_days_before ?? body.reminderDaysBefore,
    },
  });
});
