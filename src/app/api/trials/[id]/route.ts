import { getDbPool } from "@/lib/db";
import { errJson, okJson } from "@/lib/server/api/json-response";
import { parseJsonBody } from "@/lib/server/api/parse-body";
import { requireSession } from "@/lib/server/api/require-session";
import { withApiErrorHandling } from "@/lib/server/api/with-api-error-handling";
import { trialUpdateSchema } from "@/features/churn-diary/shared/schemas";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export const PATCH = withApiErrorHandling(async (req, ctx) => {
  const { user } = await requireSession();
  const { id } = await (ctx as RouteContext).params;
  const body = await parseJsonBody(req, trialUpdateSchema);

  const pool = getDbPool();
  const { rows } = await pool.query<{ id: string; service_name: string }>(
    `UPDATE "trial_entries"
        SET service_name = $3,
            trial_start_date = $4,
            trial_conversion_date = $5,
            notes = $6,
            status = $7,
            updated_at = now()
      WHERE user_id = $1 AND id = $2
      RETURNING id, service_name`,
    [
      user.id,
      id,
      body.serviceName,
      body.trialStartDate,
      body.trialConversionDate,
      body.notes ?? null,
      body.status,
    ],
  );
  const row = rows[0];
  if (!row) return errJson("not_found", 404);
  return okJson({ trial: { id: row.id, title: row.service_name } });
});

export const DELETE = withApiErrorHandling(async (_req, ctx) => {
  const { user } = await requireSession();
  const { id } = await (ctx as RouteContext).params;
  const pool = getDbPool();
  const { rowCount } = await pool.query(
    `DELETE FROM "trial_entries" WHERE user_id = $1 AND id = $2`,
    [user.id, id],
  );
  if (!rowCount) return errJson("not_found", 404);
  return okJson({ id });
});
