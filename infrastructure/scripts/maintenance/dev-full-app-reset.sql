-- DEV application database ONLY. Never run against Keycloak/STAGING/PROD.
-- The database identity and isolation are checked by the guarded shell runner.
-- Keep schema, indexes and Prisma's migration ledger intact.
BEGIN;
SET LOCAL lock_timeout = '15s';
SET LOCAL statement_timeout = '180s';

DO $reset$
DECLARE
  table_list text;
  table_count integer;
  row_record record;
  has_rows boolean;
BEGIN
  IF to_regclass('public."User"') IS NULL
    OR to_regclass('public."Article"') IS NULL
    OR to_regclass('public."ImportJob"') IS NULL
    OR to_regclass('public."_prisma_migrations"') IS NULL THEN
    RAISE EXCEPTION 'UNEXPECTED_DATABASE_SCHEMA';
  END IF;

  SELECT COUNT(*), string_agg(format('%I.%I', schemaname, tablename), ', ' ORDER BY tablename)
  INTO table_count, table_list
  FROM pg_tables
  WHERE schemaname = 'public' AND tablename <> '_prisma_migrations';

  IF table_count < 20 OR table_list IS NULL THEN
    RAISE EXCEPTION 'INSUFFICIENT_APPLICATION_TABLES';
  END IF;

  EXECUTE 'TRUNCATE TABLE ' || table_list || ' RESTART IDENTITY CASCADE';

  FOR row_record IN
    SELECT schemaname, tablename
    FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
  LOOP
    EXECUTE format(
      'SELECT EXISTS (SELECT 1 FROM %I.%I LIMIT 1)',
      row_record.schemaname,
      row_record.tablename
    ) INTO has_rows;
    IF has_rows THEN
      RAISE EXCEPTION 'NONEMPTY_TABLE_AFTER_RESET';
    END IF;
  END LOOP;

  RAISE NOTICE 'DEV_APP_DATA_RESET_VERIFIED: % application tables emptied', table_count;
END
$reset$;

COMMIT;
