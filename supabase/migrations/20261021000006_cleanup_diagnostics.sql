-- Clean up the diagnostic objects that were created while reconciling the
-- `transactions` table.
--
-- A throwaway probe table was created to work out why the PostgREST schema
-- cache was stale. It is no longer needed.
drop table if exists public.pgrst_probe;

-- The diagnostic migrations (20261021000002, 20261021000004, 20261021000005)
-- only existed to read back the live schema. They are not part of the
-- project's schema history, so remove their bookkeeping rows to keep
-- `supabase migration list` in sync with the files on disk.
delete from supabase_migrations.schema_migrations
where version in ('20261021000002', '20261021000003', '20261021000004', '20261021000005');
