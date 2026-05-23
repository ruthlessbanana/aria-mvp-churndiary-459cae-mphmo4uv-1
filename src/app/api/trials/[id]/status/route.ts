import { getDbPool } from "@/lib/db";
import { errJson, okJson } from "@/lib/server/api/json-response";
import { parseJsonBody } from "@/lib/server/api/parse-body";
import { requireSession } from "@/lib/server/api/require-session";
import { withApiErrorHandling } from "@/lib/server/api/with-api-error-handling";
import { trialTransitionSchema } from "@/features/churn-diary/shared/schemas";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export const POST = withApiErrorHandling(async (req, ctx) => {
  const { user } = await requireSession();
  const { id } = await (ctx as RouteContext).params;
  const body = await parseJsonBody(req, trialTransitionSchema);

  const pool = getDbPool();
  const { rows } = await pool.query<{ id: string; service_name: string; status: string }>(
    `UPDATE "trial_entries"
        SET status = $3, updated_at = now()
      WHERE user_id = $1 AND id = $2 AND status = 'active'
      RETURNING id, service_name, status`,
    [user.id, id, body.status],
  );
  const row = rows[0];
  if (!row) return errJson("invalid_transition", 409, "Trial is not active");
  return okJson({ trial: { id: row.id, title: row.service_name, status: row.status } });
});
