-- Add encryption fields to direct_messages table
ALTER TABLE direct_messages
ADD COLUMN encrypted_content jsonb,
ADD COLUMN is_encrypted boolean DEFAULT false;

-- Add index for faster queries on encrypted messages
CREATE INDEX idx_direct_messages_is_encrypted ON direct_messages(is_encrypted);

-- Create a function to handle encrypted message insertion
CREATE OR REPLACE FUNCTION handle_encrypted_message()
RETURNS TRIGGER AS $$
BEGIN
  -- If message is encrypted, ensure encrypted_content is present
  IF NEW.is_encrypted = true THEN
    IF NEW.encrypted_content IS NULL THEN
      RAISE EXCEPTION 'Encrypted messages must include encrypted_content';
    END IF;
    -- Clear plain text content for encrypted messages
    NEW.content = NULL;
  ELSE
    -- For unencrypted messages, ensure content is present
    IF NEW.content IS NULL THEN
      RAISE EXCEPTION 'Unencrypted messages must include content';
    END IF;
    -- Clear encrypted content for unencrypted messages
    NEW.encrypted_content = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for message encryption handling
CREATE TRIGGER encrypt_direct_message
  BEFORE INSERT OR UPDATE ON direct_messages
  FOR EACH ROW
  EXECUTE FUNCTION handle_encrypted_message();

-- Add RLS policies for encrypted messages
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their encrypted messages"
  ON direct_messages
  FOR SELECT
  USING (
    auth.uid() = sender_id OR 
    auth.uid() = recipient_id
  );

CREATE POLICY "Users can insert their encrypted messages"
  ON direct_messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    (is_encrypted = false OR encrypted_content IS NOT NULL)
  );

-- Function to clean up old messages (optional, based on retention policy)
CREATE OR REPLACE FUNCTION cleanup_old_messages()
RETURNS void AS $$
BEGIN
  -- Delete messages older than 30 days
  DELETE FROM direct_messages
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up old messages (optional)
SELECT cron.schedule(
  'cleanup-old-messages',
  '0 0 * * *', -- Run daily at midnight
  'SELECT cleanup_old_messages()'
); 