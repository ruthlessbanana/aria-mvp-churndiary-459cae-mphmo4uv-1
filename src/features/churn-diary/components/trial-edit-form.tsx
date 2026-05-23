"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type EditResponse = {
  ok: boolean;
  data?: { trial?: { id: string; title?: string } };
  error?: string;
  detail?: string;
};

type Props = {
  id: string;
  initial: {
    serviceName: string;
    trialStartDate: string;
    trialConversionDate: string;
    notes: string;
    status: string;
  };
};

export function TrialEditForm({ id, initial }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    serviceName: initial.serviceName,
    trialStartDate: initial.trialStartDate,
    trialConversionDate: initial.trialConversionDate,
    notes: initial.notes,
    status: initial.status,
  });
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/trials/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = (await res.json()) as EditResponse;
      if (!res.ok || !json.ok || !json.data?.trial?.id) {
        toast.error(json.detail ?? json.error ?? "Failed to save changes");
        return;
      }
      toast.success("Changes saved.");
      router.push(`/home/trials/${id}`);
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
          href={`/home/trials/${id}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Back to detail
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Edit Trial</h1>
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
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="min-h-[80px] w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Status *</label>
          <select
            required
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="active">active</option>
            <option value="cancelled">cancelled</option>
            <option value="converted">converted</option>
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
            href={`/home/trials/${id}`}
            className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
