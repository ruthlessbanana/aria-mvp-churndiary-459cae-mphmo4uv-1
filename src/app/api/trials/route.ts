import { getDbPool } from "@/lib/db";
import { errJson, okJson } from "@/lib/server/api/json-response";
import { parseJsonBody } from "@/lib/server/api/parse-body";
import { requireSession } from "@/lib/server/api/require-session";
import { withApiErrorHandling } from "@/lib/server/api/with-api-error-handling";
import { logger } from "@/lib/server/logger";
import { sendEmail } from "@/lib/server/email/send-email";
import { trialCreateSchema } from "@/features/churn-diary/shared/schemas";
import { listTrialsForUser } from "@/features/churn-diary/server/queries";

export const runtime = "nodejs";

export const GET = withApiErrorHandling(async () => {
  const { user } = await requireSession();
  const rows = await listTrialsForUser(user.id);
  return okJson({
    trials: rows.map((row) => ({
      id: row.id,
      serviceName: row.service_name,
      trialStartDate: row.trial_start_date,
      trialConversionDate: row.trial_conversion_date,
      notes: row.notes,
      status: row.status,
      reminderSent: row.reminder_sent,
      createdAt: row.created_at,
    })),
  });
});

export const POST = withApiErrorHandling(async (req) => {
  const { user } = await requireSession();
  const body = await parseJsonBody(req, trialCreateSchema);

  const pool = getDbPool();
  const { rows } = await pool.query<{ id: string; service_name: string }>(
    `INSERT INTO "trial_entries"
       (user_id, service_name, trial_start_date, trial_conversion_date, notes)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, service_name`,
    [
      user.id,
      body.serviceName,
      body.trialStartDate,
      body.trialConversionDate,
      body.notes ?? null,
    ],
  );
  const row = rows[0];
  if (!row) return errJson("create_failed", 500);

  if (user.email) {
    try {
      const outcome = await sendEmail({
        to: user.email,
        subject: `ChurnDiary is watching your ${row.service_name} trial`,
        html: `<p>We'll email you a reminder before your ${row.service_name} trial converts on ${body.trialConversionDate}.</p>
               <p>Manage your trial in your ChurnDiary at any time.</p>`,
      });
      try {
        await pool.query(
          `INSERT INTO "app_events" (event_type, user_id, payload)
           VALUES ($1, $2, $3::jsonb)`,
          [
            outcome.ok ? "trial_created_email_sent" : "trial_created_email_failed",
            user.id,
            JSON.stringify({ trialId: row.id, outcome }),
          ],
        );
      } catch (e) {
        logger.warn("trial_created_app_event_failed", {
          error: e instanceof Error ? e.message : String(e),
        });
      }
    } catch (e) {
      logger.error("trial_created_email_throw", {
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return okJson({ trial: { id: row.id, title: row.service_name } });
});
