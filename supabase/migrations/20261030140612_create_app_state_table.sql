/*
# Create app_state table for the wholesale store data

1. New Tables
- `app_state`
- `id` (text, primary key): identifies the store document; the app uses a single row 'main'.
- `data` (jsonb, not null): the full wholesale database document (suppliers, customers, naklat, invoices, and all other collections).
- `updated_at` (timestamptz): time of the last save.

2. Security
- Enable RLS on `app_state`.
- Grant SELECT, INSERT, UPDATE to `anon` and `authenticated` because the app has no sign-in screen and reads/writes as the anon role.
- Policies are scoped to the single-tenant document; they are intentionally public for this app and do not include DELETE.

3. Notes
- The app has no sign-in, so every policy lists `anon`.
- Only the 'main' row is used by the app.
*/

CREATE TABLE IF NOT EXISTS app_state (
  id text PRIMARY KEY,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE app_state ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON app_state TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_app_state" ON app_state;
CREATE POLICY "anon_select_app_state" ON app_state FOR SELECT
  TO anon, authenticated USING (id = 'main');

DROP POLICY IF EXISTS "anon_insert_app_state" ON app_state;
CREATE POLICY "anon_insert_app_state" ON app_state FOR INSERT
  TO anon, authenticated WITH CHECK (id = 'main');

DROP POLICY IF EXISTS "anon_update_app_state" ON app_state;
CREATE POLICY "anon_update_app_state" ON app_state FOR UPDATE
  TO anon, authenticated USING (id = 'main') WITH CHECK (id = 'main');
