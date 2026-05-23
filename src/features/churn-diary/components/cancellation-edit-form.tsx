"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type EditResponse = {
  ok: boolean;
  data?: { cancellation?: { id: string; title?: string } };
  error?: string;
  detail?: string;
};

type Props = {
  id: string;
  initial: {
    serviceName: string;
    cancelDate: string;
    monthlyCostSaved: string;
    reason: string;
    reasonNotes: string;
    mood: string;
  };
};

export function CancellationEditForm({ id, initial }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    serviceName: initial.serviceName,
    cancelDate: initial.cancelDate,
    monthlyCostSaved: initial.monthlyCostSaved,
    reason: initial.reason,
    reasonNotes: initial.reasonNotes,
    mood: initial.mood,
  });
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/cancellations/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = (await res.json()) as EditResponse;
      if (!res.ok || !json.ok || !json.data?.cancellation?.id) {
        toast.error(json.detail ?? json.error ?? "Failed to save changes");
        return;
      }
      toast.success("Changes saved.");
      router.push(`/home/cancellations/${id}`);
      router.refresh();
    } catch {
      toast.error("Failed to save changes");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <Link
          href={`/home/cancellations/${id}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Back to detail
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Edit Cancellation</h1>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 rounded-xl border bg-card p-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Service Name *</label>
          <input
            type="text"
            required
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
            {loading ? "Saving…" : "Save Changes"}
          </button>
          <Link
            href={`/home/cancellations/${id}`}
            className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
