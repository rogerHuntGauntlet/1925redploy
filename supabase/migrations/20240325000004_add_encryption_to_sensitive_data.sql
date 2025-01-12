-- Add encryption support to user_profiles table
ALTER TABLE user_profiles
ADD COLUMN encrypted_data JSONB,
ADD COLUMN encryption_version TEXT;

-- Add encryption support to payment_methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_data JSONB NOT NULL,
  encryption_version TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add encryption support to user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_data JSONB,
  encryption_version TEXT,
  public_preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_settings UNIQUE (user_id)
);

-- Create a function to validate encrypted data structure
CREATE OR REPLACE FUNCTION validate_encrypted_data()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.encrypted_data IS NOT NULL THEN
    -- Validate encrypted_data structure
    IF NEW.encrypted_data->>'encrypted' IS NULL OR
       NEW.encrypted_data->>'iv' IS NULL OR
       NEW.encrypted_data->>'tag' IS NULL OR
       NEW.encrypted_data->>'salt' IS NULL THEN
      RAISE EXCEPTION 'Invalid encrypted data structure';
    END IF;
  END IF;
  
  -- Update the updated_at timestamp
  NEW.updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for encrypted data validation
CREATE TRIGGER validate_payment_method_encryption
BEFORE INSERT OR UPDATE ON payment_methods
FOR EACH ROW
EXECUTE FUNCTION validate_encrypted_data();

CREATE TRIGGER validate_user_settings_encryption
BEFORE INSERT OR UPDATE ON user_settings
FOR EACH ROW
EXECUTE FUNCTION validate_encrypted_data();

-- Add RLS policies
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Payment methods policies
CREATE POLICY "Users can view their own payment methods"
ON payment_methods
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payment methods"
ON payment_methods
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment methods"
ON payment_methods
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payment methods"
ON payment_methods
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- User settings policies
CREATE POLICY "Users can view their own settings"
ON user_settings
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
ON user_settings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
ON user_settings
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add indexes for better performance
CREATE INDEX payment_methods_user_id_idx ON payment_methods (user_id);
CREATE INDEX user_settings_user_id_idx ON user_settings (user_id);
CREATE INDEX payment_methods_encryption_version_idx ON payment_methods (encryption_version);
CREATE INDEX user_settings_encryption_version_idx ON user_settings (encryption_version);

-- Add key version tracking table
CREATE TABLE encryption_keys (
  version TEXT PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  rotated_at TIMESTAMP WITH TIME ZONE,
  status TEXT CHECK (status IN ('active', 'rotating', 'retired')) DEFAULT 'active',
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Function to mark old keys as retired
CREATE OR REPLACE FUNCTION retire_old_encryption_keys()
RETURNS void AS $$
BEGIN
  UPDATE encryption_keys
  SET status = 'retired'
  WHERE status = 'active'
    AND created_at < NOW() - INTERVAL '90 days'
    AND version NOT IN (
      SELECT DISTINCT encryption_version 
      FROM (
        SELECT encryption_version FROM payment_methods
        UNION ALL
        SELECT encryption_version FROM user_settings
        UNION ALL
        SELECT encryption_version FROM user_profiles
      ) AS versions
      WHERE encryption_version IS NOT NULL
    );
END;
$$ LANGUAGE plpgsql;

-- Schedule key retirement check
SELECT cron.schedule(
  'retire-old-encryption-keys',
  '0 0 * * *', -- Run at midnight every day
  'SELECT retire_old_encryption_keys();'
); 