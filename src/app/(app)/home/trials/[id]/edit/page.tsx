import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getTrialForUser } from "@/features/churn-diary/server/queries";
import { TrialEditForm } from "@/features/churn-diary/components/trial-edit-form";

export const dynamic = "force-dynamic";

export default async function EditTrialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    redirect("/login");
  }
  const row = await getTrialForUser(session.user.id, id);
  if (!row) notFound();

  return (
    <TrialEditForm
      id={row.id}
      initial={{
        serviceName: row.service_name,
        trialStartDate: row.trial_start_date,
        trialConversionDate: row.trial_conversion_date,
        notes: row.notes ?? "",
        status: row.status,
      }}
    />
  );
}
