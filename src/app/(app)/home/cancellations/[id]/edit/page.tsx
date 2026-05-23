import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getCancellationForUser } from "@/features/churn-diary/server/queries";
import { CancellationEditForm } from "@/features/churn-diary/components/cancellation-edit-form";

export const dynamic = "force-dynamic";

export default async function EditCancellationPage({
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
    <CancellationEditForm
      id={row.id}
      initial={{
        serviceName: row.service_name,
        cancelDate: row.cancel_date,
        monthlyCostSaved: row.monthly_cost_saved ?? "",
        reason: row.reason,
        reasonNotes: row.reason_notes ?? "",
        mood: String(row.mood),
      }}
    />
  );
}
