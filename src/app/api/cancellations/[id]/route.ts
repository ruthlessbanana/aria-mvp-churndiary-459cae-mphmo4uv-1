import { getDbPool } from "@/lib/db";
import { errJson, okJson } from "@/lib/server/api/json-response";
import { parseJsonBody } from "@/lib/server/api/parse-body";
import { requireSession } from "@/lib/server/api/require-session";
import { withApiErrorHandling } from "@/lib/server/api/with-api-error-handling";
import {
  cancellationUpdateSchema,
  normalizeMonthlyCost,
} from "@/features/churn-diary/shared/schemas";
import { getCancellationForUser } from "@/features/churn-diary/server/queries";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withApiErrorHandling(async (_req, ctx) => {
  const { user } = await requireSession();
  const { id } = await (ctx as RouteContext).params;
  const row = await getCancellationForUser(user.id, id);
  if (!row) return errJson("not_found", 404);
  return okJson({
    cancellation: {
      id: row.id,
      serviceName: row.service_name,
      cancelDate: row.cancel_date,
      monthlyCostSaved: row.monthly_cost_saved,
      reason: row.reason,
      reasonNotes: row.reason_notes,
      mood: row.mood,
      shareToken: row.share_token,
      createdAt: row.created_at,
    },
  });
});

export const PATCH = withApiErrorHandling(async (req, ctx) => {
  const { user } = await requireSession();
  const { id } = await (ctx as RouteContext).params;
  const body = await parseJsonBody(req, cancellationUpdateSchema);
  const monthly = normalizeMonthlyCost(body.monthlyCostSaved ?? null);
  const moodNum = Number(body.mood);

  const pool = getDbPool();
  const { rows } = await pool.query<{ id: string; service_name: string }>(
    `UPDATE "cancellation_entries"
        SET service_name = $3,
            cancel_date = $4,
            monthly_cost_saved = $5,
            reason = $6,
            reason_notes = $7,
            mood = $8,
            updated_at = now()
      WHERE user_id = $1 AND id = $2
      RETURNING id, service_name`,
    [
      user.id,
      id,
      body.serviceName,
      body.cancelDate,
      monthly,
      body.reason,
      body.reasonNotes ?? null,
      moodNum,
    ],
  );
  const row = rows[0];
  if (!row) return errJson("not_found", 404);
  return okJson({ cancellation: { id: row.id, title: row.service_name } });
});

export const DELETE = withApiErrorHandling(async (_req, ctx) => {
  const { user } = await requireSession();
  const { id } = await (ctx as RouteContext).params;
  const pool = getDbPool();
  const { rowCount } = await pool.query(
    `DELETE FROM "cancellation_entries" WHERE user_id = $1 AND id = $2`,
    [user.id, id],
  );
  if (!rowCount) return errJson("not_found", 404);
  return okJson({ id });
});
