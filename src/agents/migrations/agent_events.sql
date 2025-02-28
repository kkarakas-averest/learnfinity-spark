-- Create the agent_events table if it doesn't exist
CREATE TABLE IF NOT EXISTS agent_events (
  id UUID PRIMARY KEY,
  source_agent UUID NOT NULL,
  target_agent UUID,
  event_type TEXT NOT NULL,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed BOOLEAN DEFAULT FALSE
);

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_agent_events_source ON agent_events(source_agent);
CREATE INDEX IF NOT EXISTS idx_agent_events_target ON agent_events(target_agent);
CREATE INDEX IF NOT EXISTS idx_agent_events_type ON agent_events(event_type);
CREATE INDEX IF NOT EXISTS idx_agent_events_created_at ON agent_events(created_at);
CREATE INDEX IF NOT EXISTS idx_agent_events_processed ON agent_events(processed);

-- Create a view for recent unprocessed events
CREATE OR REPLACE VIEW recent_agent_events AS
SELECT * FROM agent_events
WHERE created_at > (now() - interval '24 hours')
ORDER BY created_at DESC;

-- Create a function to create the agent_events table if it doesn't exist
CREATE OR REPLACE FUNCTION create_agent_events_if_not_exists()
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'agent_events') THEN
    CREATE TABLE agent_events (
      id UUID PRIMARY KEY,
      source_agent UUID NOT NULL,
      target_agent UUID,
      event_type TEXT NOT NULL,
      data JSONB,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      processed BOOLEAN DEFAULT FALSE
    );
    
    -- Add indexes for efficient querying
    CREATE INDEX idx_agent_events_source ON agent_events(source_agent);
    CREATE INDEX idx_agent_events_target ON agent_events(target_agent);
    CREATE INDEX idx_agent_events_type ON agent_events(event_type);
    CREATE INDEX idx_agent_events_created_at ON agent_events(created_at);
    CREATE INDEX idx_agent_events_processed ON agent_events(processed);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create a function to cleanup old agent events
CREATE OR REPLACE FUNCTION cleanup_old_agent_events()
RETURNS void AS $$
BEGIN
  DELETE FROM agent_events
  WHERE created_at < (now() - interval '30 days');
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically mark events as processed after 1 hour if not already processed
CREATE OR REPLACE FUNCTION auto_mark_processed()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE agent_events
  SET processed = TRUE
  WHERE created_at < (now() - interval '1 hour')
  AND processed = FALSE;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_auto_mark_processed
AFTER INSERT ON agent_events
EXECUTE FUNCTION auto_mark_processed();

-- Enable Row Level Security
ALTER TABLE agent_events ENABLE ROW LEVEL SECURITY;

-- Create policies for different access levels
CREATE POLICY "Agents can insert events" ON agent_events
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Agents can see their own events" ON agent_events
  FOR SELECT
  TO authenticated
  USING (
    auth.uid()::text = source_agent::text OR 
    auth.uid()::text = target_agent::text OR
    target_agent IS NULL
  );

-- Grant necessary privileges
GRANT SELECT, INSERT, UPDATE ON agent_events TO authenticated;
GRANT EXECUTE ON FUNCTION create_agent_events_if_not_exists TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_agent_events TO authenticated; 