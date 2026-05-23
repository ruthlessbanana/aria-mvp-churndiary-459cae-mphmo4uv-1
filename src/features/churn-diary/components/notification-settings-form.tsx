"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

type PrefsResponse = {
  ok: boolean;
  data?: { preferences?: { emailEnabled: boolean; reminderDaysBefore: number } };
  error?: string;
  detail?: string;
};

export function NotificationSettingsForm() {
  const [form, setForm] = useState({ emailEnabled: true, reminderDaysBefore: "7" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/settings/notifications", { credentials: "include" });
        const json = (await res.json()) as PrefsResponse;
        if (!mounted) return;
        if (res.ok && json.ok && json.data?.preferences) {
          setForm({
            emailEnabled: json.data.preferences.emailEnabled,
            reminderDaysBefore: String(json.data.preferences.reminderDaysBefore),
          });
        }
      } catch {
        if (mounted) toast.error("Could not load preferences.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings/notifications", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailEnabled: form.emailEnabled,
          reminderDaysBefore: form.reminderDaysBefore,
        }),
      });
      const json = (await res.json()) as PrefsResponse;
      if (!res.ok || !json.ok) {
        toast.error(json.detail ?? json.error ?? "Failed to save preferences");
        return;
      }
      toast.success("Preferences saved.");
      if (json.data?.preferences) {
        setForm({
          emailEnabled: json.data.preferences.emailEnabled,
          reminderDaysBefore: String(json.data.preferences.reminderDaysBefore),
        });
      }
    } catch {
      toast.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border bg-card p-4">
      <p className="text-sm text-muted-foreground">
        ChurnDiary watches your active trials and emails you a heads-up before they convert.
        Adjust how many days&apos; notice you want.
      </p>

      <div className="flex items-start gap-2">
        <input
          id="email-enabled"
          type="checkbox"
          checked={form.emailEnabled}
          onChange={(e) => setForm({ ...form, emailEnabled: e.target.checked })}
          disabled={loading || saving}
          className="mt-1"
        />
        <label htmlFor="email-enabled" className="text-sm font-medium">
          Send email reminders before trials convert
        </label>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Days before conversion to send reminder *</label>
        <input
          type="number"
          min={1}
          max={60}
          required
          placeholder="7"
          value={form.reminderDaysBefore}
          onChange={(e) => setForm({ ...form, reminderDaysBefore: e.target.value })}
          disabled={loading || saving}
          className="w-full max-w-xs rounded-md border bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={loading || saving}
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
