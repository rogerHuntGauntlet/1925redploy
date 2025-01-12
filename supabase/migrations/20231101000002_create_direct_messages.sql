-- Create direct_messages table
CREATE TABLE IF NOT EXISTS direct_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT,
    sender_id UUID NOT NULL REFERENCES user_profiles(id),
    recipient_id UUID NOT NULL REFERENCES user_profiles(id),
    is_encrypted BOOLEAN DEFAULT false,
    encrypted_content JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_direct_messages_sender_id ON direct_messages(sender_id);
CREATE INDEX idx_direct_messages_recipient_id ON direct_messages(recipient_id);
CREATE INDEX idx_direct_messages_created_at ON direct_messages(created_at);

-- Enable RLS
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can read their direct messages"
    ON direct_messages FOR SELECT
    USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can insert their direct messages"
    ON direct_messages FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

-- Create function to handle message updates
CREATE OR REPLACE FUNCTION handle_direct_message_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for message updates
CREATE TRIGGER direct_message_update_trigger
    BEFORE UPDATE ON direct_messages
    FOR EACH ROW
    EXECUTE FUNCTION handle_direct_message_update(); 