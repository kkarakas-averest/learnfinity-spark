CREATE OR REPLACE FUNCTION create_notifications_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the table already exists
  IF NOT EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'user_notifications'
  ) THEN
    -- Create the user_notifications table
    CREATE TABLE public.user_notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(50) NOT NULL,
      priority VARCHAR(20) DEFAULT 'normal',
      is_read BOOLEAN DEFAULT false,
      metadata JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );

    -- Create indexes for better performance
    CREATE INDEX idx_user_notifications_user_id ON public.user_notifications(user_id);
    CREATE INDEX idx_user_notifications_is_read ON public.user_notifications(is_read);
    CREATE INDEX idx_user_notifications_created_at ON public.user_notifications(created_at);
    
    -- Add table comment
    COMMENT ON TABLE public.user_notifications IS 'Stores user notifications for the application';
    
    -- Enable Row Level Security
    ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
    
    -- Create policy to allow users to see only their own notifications
    CREATE POLICY user_notifications_select_policy 
      ON public.user_notifications 
      FOR SELECT 
      USING (auth.uid() = user_id);
    
    -- Create policy to allow users to update only their own notifications
    CREATE POLICY user_notifications_update_policy 
      ON public.user_notifications 
      FOR UPDATE 
      USING (auth.uid() = user_id);
    
    -- Allow service role and authenticated users to insert notifications
    CREATE POLICY user_notifications_insert_policy 
      ON public.user_notifications 
      FOR INSERT 
      WITH CHECK (true);  -- Any authenticated user can insert a notification
  END IF;
END;
$$; 