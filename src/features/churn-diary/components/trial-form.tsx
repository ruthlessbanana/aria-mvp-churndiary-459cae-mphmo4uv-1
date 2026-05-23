"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type CreateResponse = {
  ok: boolean;
  data?: { trial?: { id: string; title?: string } };
  error?: string;
  detail?: string;
};

export function TrialCreateForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    serviceName: "",
    trialStartDate: "",
    trialConversionDate: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/trials", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = (await res.json()) as CreateResponse;
      if (!res.ok || !json.ok || !json.data?.trial?.id) {
        toast.error(json.detail ?? json.error ?? "Failed to add trial");
        return;
      }
      toast.success("Trial added.");
      router.push("/home");
      router.refresh();
    } catch {
      toast.error("Failed to add trial");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <Link href="/home" className="text-sm text-muted-foreground hover:underline">
          ← Back to Home
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Add Trial</h1>
        <p className="text-sm text-muted-foreground">
          We&apos;ll email you before the trial converts so you&apos;re never silently charged.{" "}
          <Link href="/settings/notifications" className="text-primary hover:underline">
            Adjust reminder timing
          </Link>
          .
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 rounded-xl border bg-card p-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Service Name *</label>
          <input
            type="text"
            required
            placeholder="e.g. Hulu, Duolingo Plus"
            value={form.serviceName}
            onChange={(e) => setForm({ ...form, serviceName: e.target.value })}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Trial Start Date *</label>
          <input
            type="date"
            required
            value={form.trialStartDate}
            onChange={(e) => setForm({ ...form, trialStartDate: e.target.value })}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Trial Converts On *</label>
          <input
            type="date"
            required
            value={form.trialConversionDate}
            onChange={(e) => setForm({ ...form, trialConversionDate: e.target.value })}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Notes</label>
          <textarea
            placeholder="Optional reminders for yourself…"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="min-h-[80px] w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {loading ? "Saving…" : "Add Trial"}
          </button>
          <Link
            href="/home"
            className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
