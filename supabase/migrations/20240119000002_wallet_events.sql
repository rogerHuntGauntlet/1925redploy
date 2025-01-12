-- Create wallet_events table
CREATE TABLE IF NOT EXISTS wallet_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event TEXT NOT NULL,
  wallet_type TEXT,
  wallet_address TEXT,
  token_balance NUMERIC,
  error TEXT,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on timestamp for efficient querying
CREATE INDEX IF NOT EXISTS idx_wallet_events_timestamp ON wallet_events(timestamp);

-- Enable RLS
ALTER TABLE wallet_events ENABLE ROW LEVEL SECURITY;

-- Create policy to allow inserts from authenticated users
CREATE POLICY "Allow inserts for service role only"
  ON wallet_events
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Create policy to allow reads for authenticated users
CREATE POLICY "Allow reads for authenticated users"
  ON wallet_events
  FOR SELECT
  TO authenticated
  USING (true); 