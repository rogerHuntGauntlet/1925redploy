-- Create promotion codes storage
CREATE TABLE IF NOT EXISTS promotion_codes (
  code VARCHAR(50) PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  discount INTEGER NOT NULL,
  max_uses INTEGER NOT NULL,
  uses INTEGER DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE promotion_codes ENABLE ROW LEVEL SECURITY;

-- Create policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'promotion_codes' 
    AND policyname = 'Promotion codes are viewable by everyone.'
  ) THEN
    CREATE POLICY "Promotion codes are viewable by everyone."
      ON promotion_codes FOR SELECT
      USING ( true );
  END IF;
END
$$;

-- Insert special promotion codes
INSERT INTO promotion_codes (code, type, discount, max_uses, description)
VALUES 
  ('FOUNDER2024', 'lifetime', 100, 100, 'Founder Access')
ON CONFLICT (code) DO NOTHING;

-- Function to validate and use promotion code
CREATE OR REPLACE FUNCTION validate_and_use_promotion_code(code_to_validate TEXT, user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  valid BOOLEAN;
BEGIN
  -- Start transaction
  BEGIN
    -- Check if code exists and has uses left
    UPDATE promotion_codes
    SET uses = uses + 1
    WHERE code = code_to_validate
      AND uses < max_uses
      AND (expires_at IS NULL OR expires_at > NOW())
    RETURNING TRUE INTO valid;

    -- If valid, update user profile
    IF valid THEN
      UPDATE user_profiles
      SET 
        has_access = TRUE,
        access_type = 'promotion',
        promotion_code = code_to_validate,
        access_granted_at = NOW()
      WHERE id = user_id;
      
      RETURN TRUE;
    END IF;

    RETURN FALSE;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 