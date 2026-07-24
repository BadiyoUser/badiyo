
-- FCM tokens
CREATE TABLE public.fcm_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fcm_tokens TO authenticated;
GRANT ALL ON public.fcm_tokens TO service_role;
ALTER TABLE public.fcm_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own fcm tokens"
  ON public.fcm_tokens FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- App config for force-update
CREATE TABLE public.app_config (
  id INT PRIMARY KEY DEFAULT 1,
  min_supported_version TEXT NOT NULL DEFAULT '1.0.0',
  current_version TEXT NOT NULL DEFAULT '1.0.0',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT app_config_singleton CHECK (id = 1)
);
GRANT SELECT ON public.app_config TO anon, authenticated;
GRANT ALL ON public.app_config TO service_role;
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "App config readable by all"
  ON public.app_config FOR SELECT
  USING (true);
INSERT INTO public.app_config (id, min_supported_version, current_version)
  VALUES (1, '1.0.0', '1.0.0');

-- Notification preferences on users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB
  NOT NULL DEFAULT '{"booking": true, "promos": true, "referrals": true}'::jsonb;
