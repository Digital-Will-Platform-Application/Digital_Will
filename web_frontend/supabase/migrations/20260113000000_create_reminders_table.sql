-- Create reminders table for scheduling periodic will review reminders
CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  reminder_type TEXT NOT NULL DEFAULT 'general' CHECK (reminder_type IN ('review_will', 'update_assets', 'check_recipients', 'security_check', 'general')),
  frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  next_reminder_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  email_notification BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS reminders_user_id_idx ON public.reminders(user_id);
CREATE INDEX IF NOT EXISTS reminders_next_reminder_date_idx ON public.reminders(next_reminder_date);
CREATE INDEX IF NOT EXISTS reminders_is_active_idx ON public.reminders(is_active);

-- Enable RLS
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own reminders
CREATE POLICY "Users can view their own reminders"
  ON public.reminders
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own reminders
CREATE POLICY "Users can insert their own reminders"
  ON public.reminders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own reminders
CREATE POLICY "Users can update their own reminders"
  ON public.reminders
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own reminders
CREATE POLICY "Users can delete their own reminders"
  ON public.reminders
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_reminders_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create trigger for updated_at
CREATE TRIGGER update_reminders_updated_at
  BEFORE UPDATE ON public.reminders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_reminders_updated_at();

-- Add comments
COMMENT ON TABLE public.reminders IS 'Stores user reminders for periodic will reviews and updates';
COMMENT ON COLUMN public.reminders.reminder_type IS 'Type of reminder: review_will, update_assets, check_recipients, security_check, or general';
COMMENT ON COLUMN public.reminders.frequency IS 'How often the reminder should repeat: daily, weekly, monthly, quarterly, or yearly';
COMMENT ON COLUMN public.reminders.next_reminder_date IS 'The next date when this reminder should trigger';
COMMENT ON COLUMN public.reminders.is_active IS 'Whether the reminder is currently active';
COMMENT ON COLUMN public.reminders.email_notification IS 'Whether to send email notifications for this reminder';
