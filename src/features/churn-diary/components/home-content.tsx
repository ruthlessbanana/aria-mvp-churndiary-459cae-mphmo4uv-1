"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type Cancellation = {
  id: string;
  serviceName: string;
  cancelDate: string;
  monthlyCostSaved: string | null;
  reason: string;
  mood: number;
  shareToken: string | null;
};

type Trial = {
  id: string;
  serviceName: string;
  trialStartDate: string;
  trialConversionDate: string;
  status: string;
  reminderSent: boolean;
};

type CancellationsPayload = {
  ok: boolean;
  data?: { cancellations?: Cancellation[] };
  error?: string;
  detail?: string;
};

type TrialsPayload = {
  ok: boolean;
  data?: { trials?: Trial[] };
  error?: string;
  detail?: string;
};

function daysUntil(dateStr: string): number {
  const target = new Date(`${dateStr}T00:00:00Z`).getTime();
  const today = new Date();
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return Math.round((target - todayUtc) / (1000 * 60 * 60 * 24));
}

export function HomeContent() {
  const [cancellations, setCancellations] = useState<Cancellation[]>([]);
  const [trials, setTrials] = useState<Trial[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [cRes, tRes] = await Promise.all([
          fetch("/api/cancellations", { credentials: "include" }),
          fetch("/api/trials", { credentials: "include" }),
        ]);
        const cJson = (await cRes.json()) as CancellationsPayload;
        const tJson = (await tRes.json()) as TrialsPayload;
        if (!mounted) return;
        if (cRes.ok && cJson.ok) setCancellations(cJson.data?.cancellations ?? []);
        if (tRes.ok && tJson.ok) setTrials(tJson.data?.trials ?? []);
      } catch {
        if (mounted) toast.error("Could not load your diary.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const totalSavings = useMemo(() => {
    return cancellations.reduce((sum, c) => {
      const n = c.monthlyCostSaved ? Number(c.monthlyCostSaved) : 0;
      return Number.isFinite(n) ? sum + n : sum;
    }, 0);
  }, [cancellations]);

  const activeTrials = useMemo(() => trials.filter((t) => t.status === "active"), [trials]);

  const filteredCancellations = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return cancellations;
    return cancellations.filter((c) => c.serviceName.toLowerCase().includes(q));
  }, [cancellations, filter]);

  const filteredTrials = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return trials;
    return trials.filter((t) => t.serviceName.toLowerCase().includes(q));
  }, [trials, filter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Your Cancellation Diary</h1>
        <p className="text-sm text-muted-foreground">
          A personal ledger of every subscription you&apos;ve quit and every trial you&apos;re watching.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Cancellations Logged</p>
          <p className="mt-1 text-2xl font-semibold">{cancellations.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Monthly Savings</p>
          <p className="mt-1 text-2xl font-semibold">${totalSavings.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Active Trials Watched</p>
          <p className="mt-1 text-2xl font-semibold">{activeTrials.length}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          placeholder="Filter by service name…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="min-w-0 flex-1 rounded-md border bg-background px-3 py-2 text-sm"
        />
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Cancellations</h2>
          <Link
            href="/home/cancellations/new"
            className="text-sm font-medium text-primary hover:underline"
          >
            + Log Cancellation
          </Link>
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : filteredCancellations.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-muted/30 p-6 text-center">
            <p className="text-sm font-medium">No cancellations logged yet.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Start your ledger by logging your first cancellation.
            </p>
            <div className="mt-4">
              <Link
                href="/home/cancellations/new"
                className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
              >
                + Log Cancellation
              </Link>
            </div>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-2">
            {filteredCancellations.map((c) => (
              <li key={c.id} className="rounded-xl border bg-card">
                <Link
                  href={`/home/cancellations/${c.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 p-4 hover:bg-muted/40"
                >
                  <div className="min-w-0">
                    <span className="block truncate font-medium">{c.serviceName}</span>
                    <span className="text-xs text-muted-foreground">
                      Cancelled {c.cancelDate} · {c.reason}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {c.monthlyCostSaved ? `$${Number(c.monthlyCostSaved).toFixed(2)}/mo saved` : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">Mood {c.mood}/5</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Active Trials</h2>
          <Link
            href="/home/trials/new"
            className="text-sm font-medium text-primary hover:underline"
          >
            + Add Trial
          </Link>
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : filteredTrials.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-muted/30 p-6 text-center">
            <p className="text-sm font-medium">No trials being watched.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Add a trial and we&apos;ll email you before it converts.
            </p>
            <div className="mt-4">
              <Link
                href="/home/trials/new"
                className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
              >
                + Add Trial
              </Link>
            </div>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-2">
            {filteredTrials.map((t) => {
              const dleft = daysUntil(t.trialConversionDate);
              return (
                <li key={t.id} className="rounded-xl border bg-card">
                  <Link
                    href={`/home/trials/${t.id}`}
                    className="flex flex-wrap items-center justify-between gap-2 p-4 hover:bg-muted/40"
                  >
                    <div className="min-w-0">
                      <span className="block truncate font-medium">{t.serviceName}</span>
                      <span className="text-xs text-muted-foreground">
                        Converts {t.trialConversionDate} · {t.status}
                      </span>
                    </div>
                    <div className="text-right text-xs">
                      {t.status === "active" ? (
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
                          {dleft >= 0 ? `${dleft}d left` : "overdue"}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">{t.status}</span>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
