import { getDbPool } from "@/lib/db";
import { errJson, okJson } from "@/lib/server/api/json-response";
import { requireSession } from "@/lib/server/api/require-session";
import { withApiErrorHandling } from "@/lib/server/api/with-api-error-handling";
import { getRequestOrigin } from "@/lib/server/auth/app-origin";
import { signShareToken } from "@/lib/share/share-token";
import { getCancellationForUser } from "@/features/churn-diary/server/queries";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export const POST = withApiErrorHandling(async (req, ctx) => {
  const { user } = await requireSession();
  const { id } = await (ctx as RouteContext).params;
  const existing = await getCancellationForUser(user.id, id);
  if (!existing) return errJson("not_found", 404);

  let token = existing.share_token;
  if (!token) {
    token = signShareToken(existing.id);
    const pool = getDbPool();
    await pool.query(
      `UPDATE "cancellation_entries"
          SET share_token = $3, updated_at = now()
        WHERE user_id = $1 AND id = $2`,
      [user.id, id, token],
    );
  }

  const origin = getRequestOrigin(req);
  const shareUrl = `${origin}/share/${token}`;
  return okJson({ share: { token, url: shareUrl } });
});
