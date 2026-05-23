import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getCancellationForUser } from "@/features/churn-diary/server/queries";
import { CancellationDetail } from "@/features/churn-diary/components/cancellation-detail";

export const dynamic = "force-dynamic";

export default async function CancellationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    redirect("/login");
  }
  const row = await getCancellationForUser(session.user.id, id);
  if (!row) notFound();

  return (
    <div className="space-y-3">
      <Link href="/home" className="text-sm text-muted-foreground hover:underline">
        ← Back
      </Link>
      <CancellationDetail
        cancellation={{
          id: row.id,
          serviceName: row.service_name,
          cancelDate: row.cancel_date,
          monthlyCostSaved: row.monthly_cost_saved,
          reason: row.reason,
          reasonNotes: row.reason_notes,
          mood: row.mood,
          shareToken: row.share_token,
        }}
      />
    </div>
  );
}
