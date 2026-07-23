-- Run this in Supabase SQL Editor (required for upload + delete to persist).
-- Safe to re-run: drops and recreates policies.

INSERT INTO storage.buckets (id, name, public)
VALUES ('submissions', 'submissions', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public insert submissions" ON submissions;
CREATE POLICY "Public insert submissions"
  ON submissions FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public upload to submissions bucket" ON storage.objects;
CREATE POLICY "Public upload to submissions bucket"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'submissions');

DROP POLICY IF EXISTS "Public delete submissions" ON submissions;
CREATE POLICY "Public delete submissions"
  ON submissions FOR DELETE
  USING (true);

DROP POLICY IF EXISTS "Public delete from submissions bucket" ON storage.objects;
CREATE POLICY "Public delete from submissions bucket"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'submissions');
