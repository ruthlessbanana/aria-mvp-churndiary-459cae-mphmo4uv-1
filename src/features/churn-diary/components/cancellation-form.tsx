"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type CreateResponse = {
  ok: boolean;
  data?: { cancellation?: { id: string; title?: string } };
  error?: string;
  detail?: string;
};

export function CancellationCreateForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    serviceName: "",
    cancelDate: "",
    monthlyCostSaved: "",
    reason: "price",
    reasonNotes: "",
    mood: "3",
  });
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/cancellations", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = (await res.json()) as CreateResponse;
      if (!res.ok || !json.ok || !json.data?.cancellation?.id) {
        toast.error(json.detail ?? json.error ?? "Failed to log cancellation");
        return;
      }
      toast.success("Cancellation logged.");
      router.push("/home");
      router.refresh();
    } catch {
      toast.error("Failed to log cancellation");
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
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Log Cancellation</h1>
        <p className="text-sm text-muted-foreground">Record a subscription you just cancelled.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 rounded-xl border bg-card p-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Service Name *</label>
          <input
            type="text"
            required
            placeholder="e.g. Netflix, Spotify"
            value={form.serviceName}
            onChange={(e) => setForm({ ...form, serviceName: e.target.value })}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Date Cancelled *</label>
          <input
            type="date"
            required
            value={form.cancelDate}
            onChange={(e) => setForm({ ...form, cancelDate: e.target.value })}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Monthly Cost Saved (USD)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="e.g. 14.99"
            value={form.monthlyCostSaved}
            onChange={(e) => setForm({ ...form, monthlyCostSaved: e.target.value })}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Why did you leave? *</label>
          <select
            required
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="price">price</option>
            <option value="quality">quality</option>
            <option value="unused">unused</option>
            <option value="found_better">found_better</option>
            <option value="other">other</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Any extra notes?</label>
          <textarea
            placeholder="Optional details about why you left…"
            value={form.reasonNotes}
            onChange={(e) => setForm({ ...form, reasonNotes: e.target.value })}
            className="min-h-[80px] w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">How did you feel about cancelling? *</label>
          <select
            required
            value={form.mood}
            onChange={(e) => setForm({ ...form, mood: e.target.value })}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {loading ? "Saving…" : "Log Cancellation"}
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
