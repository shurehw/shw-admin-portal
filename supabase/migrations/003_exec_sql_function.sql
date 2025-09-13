-- Create a function to execute arbitrary SQL (for table creation)
-- This is needed for the import script to create tables dynamically
CREATE OR REPLACE FUNCTION exec_sql(query TEXT)
RETURNS TABLE(result JSON)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Execute the dynamic SQL
  EXECUTE query;
  
  -- Try to return results if it's a SELECT query
  BEGIN
    RETURN QUERY EXECUTE 'SELECT row_to_json(t) FROM (' || query || ') t';
  EXCEPTION
    WHEN OTHERS THEN
      -- If not a SELECT or error, just return success
      RETURN QUERY SELECT '{"status": "success"}'::json;
  END;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION exec_sql TO authenticated, service_role;