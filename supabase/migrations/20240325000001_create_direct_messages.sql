-- Create typing_indicators table
CREATE TABLE IF NOT EXISTS typing_indicators (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES user_profiles(id),
    recipient_id UUID NOT NULL REFERENCES user_profiles(id),
    is_typing BOOLEAN DEFAULT false,
    last_typed TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, recipient_id)
);

-- Add RLS policies for typing_indicators
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to update their own typing status
CREATE POLICY "Users can update their own typing status"
    ON typing_indicators FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to view typing status of their conversations
CREATE POLICY "Users can view typing status of their conversations"
    ON typing_indicators FOR SELECT
    USING (auth.uid() IN (user_id, recipient_id));

-- Function to automatically clean up old typing indicators
CREATE OR REPLACE FUNCTION cleanup_typing_indicators() RETURNS trigger AS $$
BEGIN
    -- Delete typing indicators older than 10 seconds
    DELETE FROM typing_indicators
    WHERE last_typed < NOW() - INTERVAL '10 seconds';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to cleanup old typing indicators
CREATE TRIGGER cleanup_old_typing_indicators
    AFTER INSERT OR UPDATE ON typing_indicators
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_typing_indicators();

-- Add delivery status fields to direct_messages table
ALTER TABLE direct_messages 
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;

-- Create function to handle message delivery status
CREATE OR REPLACE FUNCTION handle_message_delivery() RETURNS trigger AS $$
BEGIN
    -- Set delivered_at when message is first inserted
    IF TG_OP = 'INSERT' THEN
        NEW.delivered_at = timezone('utc'::text, now());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for message delivery
CREATE TRIGGER set_message_delivered
    BEFORE INSERT ON direct_messages
    FOR EACH ROW
    EXECUTE FUNCTION handle_message_delivery();

-- Create function to update read status
CREATE OR REPLACE FUNCTION update_message_read_status(
    _message_id UUID,
    _user_id UUID
) RETURNS void AS $$
BEGIN
    UPDATE direct_messages
    SET read_at = timezone('utc'::text, now())
    WHERE id = _message_id
    AND receiver_id = _user_id
    AND read_at IS NULL;
END;
$$ LANGUAGE plpgsql; 