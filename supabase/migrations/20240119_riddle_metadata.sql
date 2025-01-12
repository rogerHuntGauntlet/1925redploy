-- Create user_metadata table
CREATE TABLE IF NOT EXISTS user_metadata (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  riddle_answer TEXT NOT NULL,
  attempts_remaining INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_metadata ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can only access their own metadata"
  ON user_metadata
  FOR ALL
  USING (auth.uid() = user_id);

-- Create index
CREATE INDEX idx_user_metadata_user_id ON user_metadata(user_id); 