-- Create a function to execute arbitrary SQL statements
-- This function is used by the schema application script
-- NOTE: This function should only be callable by the service role 
-- as it has powerful permissions to execute any SQL

-- Drop the function if it already exists
DROP FUNCTION IF EXISTS exec_sql(sql text);

-- Create the function
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with the privileges of the function creator (should be postgres)
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Restrict this function to only be callable by the service role
REVOKE ALL ON FUNCTION exec_sql(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION exec_sql(text) FROM AUTHENTICATED;
REVOKE ALL ON FUNCTION exec_sql(text) FROM ANON;

-- Grant execution to the service role only
GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role;
