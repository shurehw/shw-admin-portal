-- Harden RLS for invites and allow self-profile creation

-- Ensure pending_invites exists before applying RLS
DO $$ BEGIN
  PERFORM 1 FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'pending_invites';
  IF NOT FOUND THEN
    RAISE NOTICE 'pending_invites table not found. Skipping RLS policies for it.';
  END IF;
END $$;

-- Enable RLS on pending_invites
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pending_invites'
  ) THEN
    EXECUTE 'ALTER TABLE pending_invites ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

-- Helper: check if a policy exists
CREATE OR REPLACE FUNCTION _policy_exists(p_table regclass, p_name text)
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = split_part(p_table::text, '.', 1)
      AND tablename = split_part(p_table::text, '.', 2)
      AND policyname = p_name
  );
$$;

-- Owner can view their own invite (match by email in JWT)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pending_invites')
     AND NOT _policy_exists('public.pending_invites', 'Owner can read own invite') THEN
    CREATE POLICY "Owner can read own invite" ON pending_invites
      FOR SELECT USING (
        lower((auth.jwt() ->> 'email')::text) = lower(email)
      );
  END IF;
END $$;

-- Owner can update their own invite (e.g., mark accepted)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pending_invites')
     AND NOT _policy_exists('public.pending_invites', 'Owner can update own invite') THEN
    CREATE POLICY "Owner can update own invite" ON pending_invites
      FOR UPDATE USING (
        lower((auth.jwt() ->> 'email')::text) = lower(email)
      ) WITH CHECK (
        lower((auth.jwt() ->> 'email')::text) = lower(email)
      );
  END IF;
END $$;

-- Admins can manage all invites
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pending_invites')
     AND NOT _policy_exists('public.pending_invites', 'Admins manage invites') THEN
    CREATE POLICY "Admins manage invites" ON pending_invites
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM user_profiles up
          WHERE up.user_id = auth.uid() AND up.role = 'admin'
        )
      ) WITH CHECK (
        EXISTS (
          SELECT 1 FROM user_profiles up
          WHERE up.user_id = auth.uid() AND up.role = 'admin'
        )
      );
  END IF;
END $$;

-- Index to speed up email lookups
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pending_invites') THEN
    CREATE INDEX IF NOT EXISTS idx_pending_invites_lower_email ON pending_invites (lower(email));
  END IF;
END $$;

-- Allow authenticated users to create their own user_profiles row
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles')
     AND NOT _policy_exists('public.user_profiles', 'Users can create their own profile') THEN
    CREATE POLICY "Users can create their own profile" ON user_profiles
      FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- Cleanup helper function
DROP FUNCTION IF EXISTS _policy_exists(regclass, text);

