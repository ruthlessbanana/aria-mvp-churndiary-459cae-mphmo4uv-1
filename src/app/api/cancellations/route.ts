import { getDbPool } from "@/lib/db";
import { errJson, okJson } from "@/lib/server/api/json-response";
import { parseJsonBody } from "@/lib/server/api/parse-body";
import { requireSession } from "@/lib/server/api/require-session";
import { withApiErrorHandling } from "@/lib/server/api/with-api-error-handling";
import {
  cancellationCreateSchema,
  normalizeMonthlyCost,
} from "@/features/churn-diary/shared/schemas";
import { listCancellationsForUser } from "@/features/churn-diary/server/queries";

export const runtime = "nodejs";

export const GET = withApiErrorHandling(async () => {
  const { user } = await requireSession();
  const rows = await listCancellationsForUser(user.id);
  return okJson({
    cancellations: rows.map((row) => ({
      id: row.id,
      serviceName: row.service_name,
      cancelDate: row.cancel_date,
      monthlyCostSaved: row.monthly_cost_saved,
      reason: row.reason,
      reasonNotes: row.reason_notes,
      mood: row.mood,
      shareToken: row.share_token,
      createdAt: row.created_at,
    })),
  });
});

export const POST = withApiErrorHandling(async (req) => {
  const { user } = await requireSession();
  const body = await parseJsonBody(req, cancellationCreateSchema);
  const monthly = normalizeMonthlyCost(body.monthlyCostSaved ?? null);
  const moodNum = Number(body.mood);

  const pool = getDbPool();
  const { rows } = await pool.query<{ id: string; service_name: string }>(
    `INSERT INTO "cancellation_entries"
       (user_id, service_name, cancel_date, monthly_cost_saved, reason, reason_notes, mood)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, service_name`,
    [
      user.id,
      body.serviceName,
      body.cancelDate,
      monthly,
      body.reason,
      body.reasonNotes ?? null,
      moodNum,
    ],
  );
  const row = rows[0];
  if (!row) return errJson("create_failed", 500);
  return okJson({ cancellation: { id: row.id, title: row.service_name } });
});
