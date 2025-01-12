-- Create rate_limits table
CREATE TABLE IF NOT EXISTS rate_limits (
  id BIGSERIAL PRIMARY KEY,
  identifier TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  -- Add index for faster lookups
  CONSTRAINT rate_limits_identifier_created_at_idx UNIQUE (identifier, created_at)
);

-- Add index for faster cleanup of old records
CREATE INDEX IF NOT EXISTS rate_limits_created_at_idx ON rate_limits (created_at);

-- Function to clean up old rate limit records
CREATE OR REPLACE FUNCTION cleanup_rate_limits() RETURNS void AS $$
BEGIN
  DELETE FROM rate_limits
  WHERE created_at < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up old rate limit records
SELECT cron.schedule(
  'cleanup-rate-limits',
  '0 0 * * *', -- Run at midnight every day
  'SELECT cleanup_rate_limits();'
); 