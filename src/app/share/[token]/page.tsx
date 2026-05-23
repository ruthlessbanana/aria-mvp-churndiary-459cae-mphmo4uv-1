import Link from "next/link";

import { verifyShareToken } from "@/lib/share/share-token";
import {
  getCancellationByShareToken,
  listCancellationsForShareOwner,
} from "@/features/churn-diary/server/queries";

export const dynamic = "force-dynamic";

export default async function PublicSharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const verified = verifyShareToken(token);
  const owner = verified ? await getCancellationByShareToken(token) : null;
  if (!owner) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-3 p-6 text-center">
        <h1 className="text-2xl font-semibold">Diary not found</h1>
        <p className="text-sm text-muted-foreground">
          This share link is invalid or has been removed.
        </p>
        <Link href="/auth/sign-up" className="text-sm font-medium text-primary hover:underline">
          Start your own ChurnDiary →
        </Link>
      </main>
    );
  }

  const rows = await listCancellationsForShareOwner(owner.user_id);

  return (
    <main className="mx-auto min-h-screen max-w-2xl space-y-4 p-4 sm:p-6">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Public Diary</p>
        <h1 className="text-2xl font-semibold tracking-tight">Subscriptions I&apos;ve cancelled</h1>
        <p className="text-sm text-muted-foreground">
          A read-only diary of services this user has quit. Costs are kept private.
        </p>
      </header>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No cancellations yet.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-2">
          {rows.map((row) => (
            <li key={row.id} className="rounded-xl border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-medium">{row.service_name}</h2>
                <span className="text-xs text-muted-foreground">{row.cancel_date}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Reason: <span className="font-medium text-foreground">{row.reason}</span> · Mood{" "}
                {row.mood}/5
              </p>
              {row.reason_notes ? (
                <p className="mt-2 whitespace-pre-wrap text-sm">{row.reason_notes}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <footer className="pt-6 text-center text-xs text-muted-foreground">
        <Link href="/auth/sign-up" className="font-medium text-primary hover:underline">
          Start your own ChurnDiary →
        </Link>
      </footer>
    </main>
  );
}
