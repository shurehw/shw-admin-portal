-- Create email_settings table for user-specific email configurations
CREATE TABLE IF NOT EXISTS public.email_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  smtp_host TEXT,
  smtp_port TEXT DEFAULT '587',
  smtp_user TEXT,
  smtp_pass TEXT, -- Should be encrypted in production
  smtp_secure BOOLEAN DEFAULT false,
  from_name TEXT,
  from_address TEXT,
  reply_to TEXT,
  use_for_tickets BOOLEAN DEFAULT true,
  use_for_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can only view and edit their own email settings
CREATE POLICY "Users can view own email settings" ON public.email_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own email settings" ON public.email_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own email settings" ON public.email_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own email settings" ON public.email_settings
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_email_settings_updated_at 
  BEFORE UPDATE ON public.email_settings 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_email_settings_user_id ON public.email_settings(user_id);

-- Grant permissions
GRANT ALL ON public.email_settings TO authenticated;
GRANT ALL ON public.email_settings TO service_role;