import { getDbPool } from "@/lib/db";
import { errJson, okJson } from "@/lib/server/api/json-response";
import { withApiErrorHandling } from "@/lib/server/api/with-api-error-handling";
import { logger } from "@/lib/server/logger";
import { sendEmail } from "@/lib/server/email/send-email";

export const runtime = "nodejs";

type DueRow = {
  id: string;
  user_id: string;
  service_name: string;
  trial_conversion_date: string;
  user_email: string | null;
  reminder_days_before: number;
};

async function isAuthorized(req: Request): Promise<boolean> {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }
  const header = req.headers.get("authorization")?.trim() ?? "";
  return header === `Bearer ${secret}`;
}

async function processReminders() {
  const pool = getDbPool();
  const { rows } = await pool.query<DueRow>(
    `SELECT t.id,
            t.user_id,
            t.service_name,
            to_char(t.trial_conversion_date, 'YYYY-MM-DD') AS trial_conversion_date,
            u.email AS user_email,
            COALESCE(p.reminder_days_before, 7) AS reminder_days_before
       FROM "trial_entries" t
       JOIN "user" u ON u.id = t.user_id
  LEFT JOIN "notification_preferences" p ON p.user_id = t.user_id
      WHERE t.status = 'active'
        AND t.reminder_sent = false
        AND COALESCE(p.email_enabled, true) = true
        AND t.trial_conversion_date <= (CURRENT_DATE + COALESCE(p.reminder_days_before, 7) * INTERVAL '1 day')`,
  );

  let sent = 0;
  let failed = 0;
  for (const row of rows) {
    if (!row.user_email) {
      try {
        await pool.query(
          `UPDATE "trial_entries" SET reminder_sent = true, updated_at = now()
            WHERE id = $1`,
          [row.id],
        );
      } catch {
        // ignore
      }
      continue;
    }
    let outcome: { ok: boolean; error?: string } = { ok: false };
    try {
      const result = await sendEmail({
        to: row.user_email,
        subject: `Your ${row.service_name} trial converts soon`,
        html: `<p>Heads up — your <strong>${row.service_name}</strong> trial converts on ${row.trial_conversion_date}.</p>
               <p>Log into ChurnDiary to cancel before you're charged.</p>`,
      });
      outcome = result.ok ? { ok: true } : { ok: false, error: result.error };
    } catch (e) {
      outcome = { ok: false, error: e instanceof Error ? e.message : String(e) };
    }

    if (outcome.ok) {
      sent += 1;
      try {
        await pool.query(
          `UPDATE "trial_entries" SET reminder_sent = true, updated_at = now()
            WHERE id = $1`,
          [row.id],
        );
        await pool.query(
          `INSERT INTO "app_events" (event_type, user_id, payload)
           VALUES ($1, $2, $3::jsonb)`,
          [
            "trial_reminder_due_email_sent",
            row.user_id,
            JSON.stringify({ trialId: row.id, serviceName: row.service_name }),
          ],
        );
      } catch (e) {
        logger.warn("trial_reminder_followup_failed", {
          error: e instanceof Error ? e.message : String(e),
        });
      }
    } else {
      failed += 1;
      try {
        await pool.query(
          `INSERT INTO "app_events" (event_type, user_id, payload)
           VALUES ($1, $2, $3::jsonb)`,
          [
            "trial_reminder_due_email_failed",
            row.user_id,
            JSON.stringify({ trialId: row.id, error: outcome.error ?? "unknown" }),
          ],
        );
      } catch (e) {
        logger.warn("trial_reminder_event_failed", {
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }
  }
  return { evaluated: rows.length, sent, failed };
}

export const GET = withApiErrorHandling(async (req) => {
  if (!(await isAuthorized(req))) {
    return errJson("unauthorized", 401);
  }
  const result = await processReminders();
  return okJson(result);
});

export const POST = withApiErrorHandling(async (req) => {
  if (!(await isAuthorized(req))) {
    return errJson("unauthorized", 401);
  }
  const result = await processReminders();
  return okJson(result);
});
