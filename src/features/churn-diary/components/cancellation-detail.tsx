"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type Cancellation = {
  id: string;
  serviceName: string;
  cancelDate: string;
  monthlyCostSaved: string | null;
  reason: string;
  reasonNotes: string | null;
  mood: number;
  shareToken: string | null;
};

type ShareResponse = {
  ok: boolean;
  data?: { share?: { token: string; url: string } };
  error?: string;
  detail?: string;
};

type DeleteResponse = {
  ok: boolean;
  data?: { id?: string };
  error?: string;
  detail?: string;
};

export function CancellationDetail({ cancellation }: { cancellation: Cancellation }) {
  const router = useRouter();
  const [shareUrl, setShareUrl] = useState<string | null>(
    cancellation.shareToken
      ? (typeof window !== "undefined"
          ? `${window.location.origin}/share/${cancellation.shareToken}`
          : `/share/${cancellation.shareToken}`)
      : null,
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [working, setWorking] = useState(false);

  async function onCopyShareLink() {
    try {
      const res = await fetch(`/api/cancellations/${cancellation.id}/share`, {
        method: "POST",
        credentials: "include",
      });
      const json = (await res.json()) as ShareResponse;
      if (!res.ok || !json.ok || !json.data?.share?.url) {
        toast.error(json.detail ?? json.error ?? "Failed to create share link");
        return;
      }
      const url = json.data.share.url;
      setShareUrl(url);
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Share link copied to clipboard.");
      } catch {
        toast.success("Share link ready.");
      }
    } catch {
      toast.error("Failed to create share link");
    }
  }

  async function onDelete() {
    setWorking(true);
    try {
      const res = await fetch(`/api/cancellations/${cancellation.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = (await res.json()) as DeleteResponse;
      if (!res.ok || !json.ok) {
        toast.error(json.detail ?? json.error ?? "Failed to delete");
        return;
      }
      toast.success("Cancellation deleted.");
      router.push("/home");
      router.refresh();
    } catch {
      toast.error("Failed to delete");
    } finally {
      setWorking(false);
      setConfirmOpen(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <Link href="/home" className="text-sm text-muted-foreground hover:underline">
          ← Back to Home
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{cancellation.serviceName}</h1>
        <p className="text-sm text-muted-foreground">Cancelled {cancellation.cancelDate}</p>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted-foreground">Reason</dt>
            <dd className="font-medium">{cancellation.reason}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Mood</dt>
            <dd className="font-medium">{cancellation.mood}/5</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Monthly Cost Saved</dt>
            <dd className="font-medium">
              {cancellation.monthlyCostSaved
                ? `$${Number(cancellation.monthlyCostSaved).toFixed(2)}`
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Date</dt>
            <dd className="font-medium">{cancellation.cancelDate}</dd>
          </div>
          {cancellation.reasonNotes ? (
            <div className="sm:col-span-2">
              <dt className="text-xs text-muted-foreground">Notes</dt>
              <dd className="whitespace-pre-wrap">{cancellation.reasonNotes}</dd>
            </div>
          ) : null}
        </dl>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onCopyShareLink}
          className="inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          Copy share link
        </button>
        <Link
          href={`/home/cancellations/${cancellation.id}/edit`}
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

      {shareUrl ? (
        <div className="rounded-md border bg-muted/30 p-3 text-xs">
          <p className="font-medium">Public share link</p>
          <p className="mt-1 break-all text-muted-foreground">{shareUrl}</p>
        </div>
      ) : null}

      {confirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-card p-4 shadow-lg">
            <p className="font-semibold">Delete this cancellation?</p>
            <p className="mt-1 text-sm text-muted-foreground">
              This permanently removes the entry from your diary.
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
