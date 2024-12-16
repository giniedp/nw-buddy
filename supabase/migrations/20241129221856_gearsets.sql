CREATE TABLE IF NOT EXISTS "gearsets" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "user_id" UUID NOT NULL REFERENCES auth.users ON
  DELETE CASCADE,
  "name" TEXT NOT NULL,
  "slots" JSONB,
  "description" TEXT,
  "attrs" JSONB,
  "tags" JSONB,
  "magnify" JSONB,
  "skills" JSONB,
  "image_url" TEXT,
  "visibility" VISIBILITY DEFAULT 'public',
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  "updated_at" timestamptz,
  UNIQUE("id", "user_id")
);

CREATE INDEX idx_gearsets_user_id on "gearsets"("user_id");

--------------------------------         ###  REALTIME  ###    -----------------------------------------
-- Have to explicitly enable realtime per table
ALTER PUBLICATION supabase_realtime
ADD TABLE gearsets;

---------------------------------         ###  ROW LEVEL SECURITY  ###     -------------------------------------
-- https://supabase.com/docs/guides/database/postgres/row-level-security
-- https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select  USE SELECT FOR PERFORMANCE
-- Enables RLS for the GEARSETS table
ALTER TABLE gearsets ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "authenticated user listen to all" ON "realtime"."messages" AS PERMISSIVE FOR
-- SELECT -- receive
--   TO authenticated USING (true);
-- CREATE POLICY "authenticated user write to all" ON "realtime"."messages" AS permissive FOR
-- INSERT -- send
--   TO authenticated WITH CHECK (true);
-- Sets RLS Policy on SELECT for GEARSETS to PUBLIC. So anyone can select a GEARSETS
CREATE POLICY "Public gearsets are viewable by everyone" ON gearsets FOR
SELECT USING (
    visibility = 'public'
    OR (
      visibility != 'public'
      AND (
        (
          SELECT auth.uid()
        ) = gearsets.user_id
      )
    )
  );

-- https://supabase.com/docs/guides/database/postgres/row-level-security#insert-policies
CREATE POLICY "Users can insert their own gearsets." ON gearsets FOR
INSERT TO AUTHENTICATED WITH CHECK (
    (
      SELECT auth.uid ()
    ) = gearsets.user_id
  );

CREATE POLICY "Users can update own gearsets." ON gearsets FOR
UPDATE TO AUTHENTICATED USING (
    (
      SELECT auth.uid ()
    ) = gearsets.user_id
  ) WITH CHECK (
    (
      SELECT auth.uid()
    ) = gearsets.user_id
  );

CREATE POLICY "Users can delete own gearsets." ON gearsets FOR DELETE TO AUTHENTICATED USING (
  (
    SELECT auth.uid ()
  ) = gearsets.user_id
);

---------------------------------         ###  TRIGGERS  ###     -------------------------------------
---- Set the `updated_at` column on every update
-- Create the trigger function
CREATE OR REPLACE FUNCTION handle_gearsets_updated_at() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
set search_path = '' AS $$ BEGIN -- Check if the `updated_at` field is explicitly provided
  -- OR if it is unchanged
  IF NEW.updated_at IS DISTINCT
FROM OLD.updated_at THEN -- Allow the provided `updated_at` value to remain
  RETURN NEW;

END IF;

-- Auto-update the `updated_at` field since it wasn't explicitly provided or it matches the old value
NEW.updated_at := NOW();

RETURN NEW;

END;

$$;

-- Create the trigger
CREATE TRIGGER handle_gearsets_updated_at BEFORE
UPDATE ON gearsets FOR EACH ROW EXECUTE FUNCTION handle_gearsets_updated_at();