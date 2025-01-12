-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- Create auth_attempts table
CREATE TABLE IF NOT EXISTS auth_attempts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    ip_address TEXT -- Optional: Add if you want to track by IP as well
);

-- Create index for faster lookups
CREATE INDEX idx_auth_attempts_email_created_at ON auth_attempts(email, created_at);

-- Add RLS policies
ALTER TABLE auth_attempts ENABLE ROW LEVEL SECURITY;

-- Only allow inserts and selects, no updates or deletes
CREATE POLICY "Allow inserts for all" ON auth_attempts
    FOR INSERT TO authenticated, anon
    WITH CHECK (true);

CREATE POLICY "Allow selects for service role only" ON auth_attempts
    FOR SELECT TO service_role
    USING (true);

-- Create function to clean up old attempts (older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_auth_attempts()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM auth_attempts
    WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- Instead of using cron, we'll create a trigger to auto-cleanup old records
CREATE OR REPLACE FUNCTION auto_cleanup_auth_attempts()
RETURNS trigger AS $$
BEGIN
    DELETE FROM auth_attempts
    WHERE created_at < NOW() - INTERVAL '24 hours';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cleanup_old_attempts_trigger
    AFTER INSERT ON auth_attempts
    EXECUTE FUNCTION auto_cleanup_auth_attempts(); 