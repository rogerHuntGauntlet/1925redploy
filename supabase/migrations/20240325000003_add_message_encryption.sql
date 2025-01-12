-- Add encrypted content columns to direct_messages table
ALTER TABLE direct_messages
ADD COLUMN encrypted_content JSONB,
ADD COLUMN is_encrypted BOOLEAN DEFAULT false;

-- Create a function to validate encrypted content structure
CREATE OR REPLACE FUNCTION validate_encrypted_content()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if message is marked as encrypted
  IF NEW.is_encrypted THEN
    -- Validate encrypted_content structure
    IF NEW.encrypted_content IS NULL OR
       NEW.encrypted_content->>'encrypted' IS NULL OR
       NEW.encrypted_content->>'iv' IS NULL OR
       NEW.encrypted_content->>'tag' IS NULL OR
       NEW.encrypted_content->>'salt' IS NULL THEN
      RAISE EXCEPTION 'Invalid encrypted content structure';
    END IF;
    
    -- Clear plaintext content when encrypted
    NEW.content = NULL;
  ELSE
    -- Ensure content is present when not encrypted
    IF NEW.content IS NULL THEN
      RAISE EXCEPTION 'Content is required for unencrypted messages';
    END IF;
    
    -- Clear encrypted content when not encrypted
    NEW.encrypted_content = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate encrypted content
CREATE TRIGGER validate_message_encryption
BEFORE INSERT OR UPDATE ON direct_messages
FOR EACH ROW
EXECUTE FUNCTION validate_encrypted_content();

-- Add index for faster queries on encrypted messages
CREATE INDEX direct_messages_is_encrypted_idx ON direct_messages (is_encrypted);

-- Add RLS policies for encrypted messages
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own encrypted messages"
ON direct_messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id AND
  (NOT is_encrypted OR encrypted_content IS NOT NULL)
);

CREATE POLICY "Users can read encrypted messages they're involved in"
ON direct_messages
FOR SELECT
TO authenticated
USING (
  auth.uid() IN (sender_id, recipient_id)
);

COMMENT ON TABLE direct_messages IS 'Direct messages between users, with support for end-to-end encryption'; 