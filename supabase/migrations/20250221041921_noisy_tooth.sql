/*
  # Add function for filtering routes by tags

  1. New Functions
    - `get_routes_with_all_tags`: Returns routes that have ALL specified tags
    - Handles proper tag filtering by checking for the presence of all required tags

  2. Changes
    - Adds a more efficient way to filter routes by tags
    - Ensures routes match ALL selected tags, not just any of them
*/

-- Function to get routes that have all specified tags
CREATE OR REPLACE FUNCTION get_routes_with_all_tags(tag_names text[])
RETURNS SETOF uuid AS $$
BEGIN
  RETURN QUERY
  SELECT r.id
  FROM routes r
  JOIN route_tags rt ON r.id = rt.route_id
  WHERE rt.tag = ANY(tag_names)
  GROUP BY r.id
  HAVING array_agg(rt.tag) @> tag_names;
END;
$$ LANGUAGE plpgsql STABLE;