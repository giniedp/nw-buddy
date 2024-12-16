CREATE TABLE "profiles" (
  "id" UUID PRIMARY KEY NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  "username" TEXT NOT NULL,
  "avatar_url" TEXT,
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz
);

---------------------------------         ###  ROW LEVEL SECURITY  ###     -------------------------------------
-- https://supabase.com/docs/guides/database/postgres/row-level-security
-- https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select  USE SELECT FOR PERFORMANCE
-- Enables RLS for the PROFILES table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Sets RLS Policy on SELECT for PROFILES to PUBLIC. So anyone can select a PROFILE
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR
SELECT USING (TRUE);

-- https://supabase.com/docs/guides/database/postgres/row-level-security#insert-policies
CREATE POLICY "Users can insert their own profile." ON profiles FOR
INSERT WITH CHECK (
    (
      SELECT auth.uid ()
    ) = id
  );

CREATE POLICY "Users can update own profile." ON profiles FOR
UPDATE USING (
    (
      SELECT auth.uid ()
    ) = id
  );

CREATE POLICY "Users can delete own profile." ON profiles FOR DELETE USING (
  (
    SELECT auth.uid ()
  ) = id
);

---------------------------------         ###  TRIGGERS  ###     -------------------------------------
---- Set the `updated_at` column on every update
CREATE TRIGGER handle_profile_updated_at BEFORE
UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);

-- When a new auth user is created by Supabase, create a profile for them
-- We can get the user metadata column values like this if we need them
-- NEW.raw_user_meta_data->>'user_name', NEW.email, NEW.raw_user_meta_data->>'avatar_url'
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
set search_path = '' AS $$ BEGIN
INSERT INTO public.profiles (
    "id",
    "username",
    "avatar_url"
  )
VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );

RETURN new;

END;

$$;

CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user ();