-- Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_profiles (
  profile_id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  has_access BOOLEAN NOT NULL DEFAULT false,
  access_type VARCHAR(50), -- 'paid', 'token_holder', 'promotion'
  access_granted_at TIMESTAMP WITH TIME ZONE,
  access_expires_at TIMESTAMP WITH TIME ZONE, -- NULL for lifetime access
  promotion_code VARCHAR(50),
  wallet_address VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all profiles"
  ON user_profiles
  USING (auth.role() = 'service_role');

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_has_access ON user_profiles(has_access);

-- Insert special promotion codes
INSERT INTO storage.objects (bucket_id, name, owner, created_at, updated_at, metadata)
VALUES 
  ('system', 'promotion_codes/FOUNDER2024', auth.uid(), NOW(), NOW(), 
   jsonb_build_object('type', 'promotion', 'discount', 100, 'max_uses', 100, 'description', 'Founder Access'));

-- Function to validate promotion codes
CREATE OR REPLACE FUNCTION validate_promotion_code(code TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM storage.objects 
    WHERE bucket_id = 'system' 
    AND name = concat('promotion_codes/', code)
    AND (metadata->>'max_uses')::int > (
      SELECT COUNT(*) FROM user_profiles 
      WHERE promotion_code = code
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 