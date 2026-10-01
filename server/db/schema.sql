-- ===========================================================================
-- VisionX — Smart Visual Experience
-- PostgreSQL schema (idempotent). Run with: npm run migrate
-- ===========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'inspector' CHECK (role IN ('admin', 'inspector', 'analyst')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- SCANS TABLE
CREATE TABLE IF NOT EXISTS scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    mode VARCHAR(10) NOT NULL CHECK (mode IN ('REAL', 'DEMO')),
    source_type VARCHAR(20) NOT NULL CHECK (source_type IN ('CAMERA', 'UPLOAD')),
    image_url TEXT NOT NULL,
    scene_category VARCHAR(100) NOT NULL,
    scene_description TEXT NOT NULL,
    total_objects INTEGER NOT NULL DEFAULT 0,
    highest_confidence NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    severity_score NUMERIC(5, 3) NOT NULL DEFAULT 0.000,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- DETECTED OBJECTS TABLE
CREATE TABLE IF NOT EXISTS detected_objects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scan_id UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
    object_name VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    confidence NUMERIC(5, 2) NOT NULL,
    bounding_box JSONB NOT NULL, -- { x_min, y_min, x_max, y_max } normalized 0-100
    insight TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_scans_user_id ON scans(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON scans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scans_mode ON scans(mode);
CREATE INDEX IF NOT EXISTS idx_scans_severity ON scans(severity_score DESC);
CREATE INDEX IF NOT EXISTS idx_objects_scan_id ON detected_objects(scan_id);
CREATE INDEX IF NOT EXISTS idx_objects_category ON detected_objects(category);

-- ===========================================================================
-- ROW LEVEL SECURITY
--
-- The Express API connects as a single privileged application role, so it
-- enforces tenant isolation in application code via `WHERE user_id = $1`.
-- The policies below are active only when the connecting role is NOT the table
-- owner and a Supabase/Neon `auth.uid()` context is available; they are
-- wrapped in a DO block so plain PostgreSQL (where `auth` schema does not
-- exist) skips them without erroring the migration.
-- ===========================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN

    ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
    ALTER TABLE detected_objects ENABLE ROW LEVEL SECURITY;

    -- Users can read and update only their own profile
    DROP POLICY IF EXISTS user_self_policy ON users;
    CREATE POLICY user_self_policy ON users
        FOR ALL USING (id = auth.uid());

    -- Scans isolation: owners see their own scans; admins see all
    DROP POLICY IF EXISTS scan_isolation_policy ON scans;
    CREATE POLICY scan_isolation_policy ON scans
        FOR ALL USING (
            user_id = auth.uid()
            OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
        );

    -- Objects isolation: cascades from scan ownership
    DROP POLICY IF EXISTS object_isolation_policy ON detected_objects;
    CREATE POLICY object_isolation_policy ON detected_objects
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM scans
                WHERE scans.id = detected_objects.scan_id
                AND (
                    scans.user_id = auth.uid()
                    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
                )
            )
        );

  END IF;
END $$;
