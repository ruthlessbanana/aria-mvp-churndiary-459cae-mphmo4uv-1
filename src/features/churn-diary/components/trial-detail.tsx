"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type Trial = {
  id: string;
  serviceName: string;
  trialStartDate: string;
  trialConversionDate: string;
  notes: string | null;
  status: string;
  reminderSent: boolean;
};

type StatusResponse = {
  ok: boolean;
  data?: { trial?: { id: string; status: string } };
  error?: string;
  detail?: string;
};

type DeleteResponse = {
  ok: boolean;
  data?: { id?: string };
  error?: string;
  detail?: string;
};

function daysUntil(dateStr: string): number {
  const target = new Date(`${dateStr}T00:00:00Z`).getTime();
  const today = new Date();
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return Math.round((target - todayUtc) / (1000 * 60 * 60 * 24));
}

export function TrialDetail({ trial }: { trial: Trial }) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState(trial.status);
  const [working, setWorking] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function transition(target: "cancelled" | "converted") {
    setWorking(true);
    try {
      const res = await fetch(`/api/trials/${trial.id}/status`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: target }),
      });
      const json = (await res.json()) as StatusResponse;
      if (!res.ok || !json.ok || !json.data?.trial) {
        toast.error(json.detail ?? json.error ?? "Failed to update status");
        return;
      }
      setCurrentStatus(json.data.trial.status);
      toast.success(`Marked as ${target}.`);
      router.refresh();
    } catch {
      toast.error("Failed to update status");
    } finally {
      setWorking(false);
    }
  }

  async function onDelete() {
    setWorking(true);
    try {
      const res = await fetch(`/api/trials/${trial.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = (await res.json()) as DeleteResponse;
      if (!res.ok || !json.ok) {
        toast.error(json.detail ?? json.error ?? "Failed to delete");
        return;
      }
      toast.success("Trial deleted.");
      router.push("/home");
      router.refresh();
    } catch {
      toast.error("Failed to delete");
    } finally {
      setWorking(false);
      setConfirmOpen(false);
    }
  }

  const dleft = daysUntil(trial.trialConversionDate);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <Link href="/home" className="text-sm text-muted-foreground hover:underline">
          ← Back to Home
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{trial.serviceName}</h1>
          <span
            className={
              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium " +
              (currentStatus === "active"
                ? "bg-primary/10 text-primary"
                : currentStatus === "cancelled"
                  ? "bg-muted text-muted-foreground"
                  : "bg-amber-500/10 text-amber-700")
            }
          >
            {currentStatus}
          </span>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted-foreground">Trial Start</dt>
            <dd className="font-medium">{trial.trialStartDate}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Converts On</dt>
            <dd className="font-medium">{trial.trialConversionDate}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Countdown</dt>
            <dd className="font-medium">
              {currentStatus === "active"
                ? dleft >= 0
                  ? `${dleft} day${dleft === 1 ? "" : "s"} left`
                  : "overdue"
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Reminder Sent</dt>
            <dd className="font-medium">{trial.reminderSent ? "Yes" : "No"}</dd>
          </div>
          {trial.notes ? (
            <div className="sm:col-span-2">
              <dt className="text-xs text-muted-foreground">Notes</dt>
              <dd className="whitespace-pre-wrap">{trial.notes}</dd>
            </div>
          ) : null}
        </dl>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {currentStatus === "active" ? (
          <>
            <button
              type="button"
              disabled={working}
              onClick={() => transition("cancelled")}
              className="inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
            >
              Mark as Cancelled
            </button>
            <button
              type="button"
              disabled={working}
              onClick={() => transition("converted")}
              className="inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
            >
              Mark as Converted
            </button>
          </>
        ) : null}
        <Link
          href={`/home/trials/${trial.id}/edit`}
          className="inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          Edit
        </Link>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className="inline-flex items-center rounded-md border border-destructive/40 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
        >
          Delete
        </button>
      </div>

      {confirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-card p-4 shadow-lg">
            <p className="font-semibold">Delete this trial?</p>
            <p className="mt-1 text-sm text-muted-foreground">
              This permanently removes the trial from your watchlist.
            </p>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                disabled={working}
                onClick={() => setConfirmOpen(false)}
                className="inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={working}
                onClick={onDelete}
                className="inline-flex items-center rounded-md bg-destructive px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {working ? "Deleting…" : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
