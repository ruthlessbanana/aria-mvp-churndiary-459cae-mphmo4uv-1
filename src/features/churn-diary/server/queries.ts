import { getDbPool } from "@/lib/db";

export type CancellationRow = {
  id: string;
  user_id: string;
  service_name: string;
  cancel_date: string;
  monthly_cost_saved: string | null;
  reason: string;
  reason_notes: string | null;
  mood: number;
  share_token: string | null;
  created_at: string;
  updated_at: string;
};

export type TrialRow = {
  id: string;
  user_id: string;
  service_name: string;
  trial_start_date: string;
  trial_conversion_date: string;
  notes: string | null;
  status: string;
  reminder_sent: boolean;
  created_at: string;
  updated_at: string;
};

export type NotificationPrefsRow = {
  id: string;
  user_id: string;
  email_enabled: boolean;
  reminder_days_before: number;
  created_at: string;
  updated_at: string;
};

export async function listCancellationsForUser(userId: string): Promise<CancellationRow[]> {
  const pool = getDbPool();
  const { rows } = await pool.query<CancellationRow>(
    `SELECT id, user_id, service_name,
            to_char(cancel_date, 'YYYY-MM-DD') AS cancel_date,
            monthly_cost_saved::text AS monthly_cost_saved,
            reason, reason_notes, mood, share_token,
            created_at, updated_at
       FROM "cancellation_entries"
      WHERE user_id = $1
      ORDER BY cancel_date DESC, created_at DESC`,
    [userId],
  );
  return rows;
}

export async function getCancellationForUser(userId: string, id: string): Promise<CancellationRow | null> {
  const pool = getDbPool();
  const { rows } = await pool.query<CancellationRow>(
    `SELECT id, user_id, service_name,
            to_char(cancel_date, 'YYYY-MM-DD') AS cancel_date,
            monthly_cost_saved::text AS monthly_cost_saved,
            reason, reason_notes, mood, share_token,
            created_at, updated_at
       FROM "cancellation_entries"
      WHERE user_id = $1 AND id = $2
      LIMIT 1`,
    [userId, id],
  );
  return rows[0] ?? null;
}

export async function getCancellationByShareToken(token: string): Promise<CancellationRow | null> {
  const pool = getDbPool();
  const { rows } = await pool.query<CancellationRow>(
    `SELECT id, user_id, service_name,
            to_char(cancel_date, 'YYYY-MM-DD') AS cancel_date,
            monthly_cost_saved::text AS monthly_cost_saved,
            reason, reason_notes, mood, share_token,
            created_at, updated_at
       FROM "cancellation_entries"
      WHERE share_token = $1
      LIMIT 1`,
    [token],
  );
  return rows[0] ?? null;
}

export async function listCancellationsForShareOwner(userId: string): Promise<CancellationRow[]> {
  return listCancellationsForUser(userId);
}

export async function listTrialsForUser(userId: string): Promise<TrialRow[]> {
  const pool = getDbPool();
  const { rows } = await pool.query<TrialRow>(
    `SELECT id, user_id, service_name,
            to_char(trial_start_date, 'YYYY-MM-DD') AS trial_start_date,
            to_char(trial_conversion_date, 'YYYY-MM-DD') AS trial_conversion_date,
            notes, status, reminder_sent, created_at, updated_at
       FROM "trial_entries"
      WHERE user_id = $1
      ORDER BY trial_conversion_date ASC, created_at DESC`,
    [userId],
  );
  return rows;
}

export async function getTrialForUser(userId: string, id: string): Promise<TrialRow | null> {
  const pool = getDbPool();
  const { rows } = await pool.query<TrialRow>(
    `SELECT id, user_id, service_name,
            to_char(trial_start_date, 'YYYY-MM-DD') AS trial_start_date,
            to_char(trial_conversion_date, 'YYYY-MM-DD') AS trial_conversion_date,
            notes, status, reminder_sent, created_at, updated_at
       FROM "trial_entries"
      WHERE user_id = $1 AND id = $2
      LIMIT 1`,
    [userId, id],
  );
  return rows[0] ?? null;
}

export async function getNotificationPrefs(userId: string): Promise<NotificationPrefsRow | null> {
  const pool = getDbPool();
  const { rows } = await pool.query<NotificationPrefsRow>(
    `SELECT id, user_id, email_enabled, reminder_days_before, created_at, updated_at
       FROM "notification_preferences"
      WHERE user_id = $1
      LIMIT 1`,
    [userId],
  );
  return rows[0] ?? null;
}
