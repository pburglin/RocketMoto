/*
  # Add functions for leaderboards
  
  1. Functions
    - get_top_routes: Returns top N routes by like count
    - get_top_authors: Returns top N authors by route count with formatted location (city, state, country)
*/

-- Function to get city, state and country from location coordinates
CREATE OR REPLACE FUNCTION get_city_country_from_location(location_str text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  lat numeric;
  lon numeric;
  api_response jsonb;
  city text;
  state text;
  country text;
BEGIN
  IF location_str IS NULL THEN
    RETURN NULL;
  END IF;

  -- Extract lat and lon from location string
  SELECT 
    split_part(location_str, ',', 1)::numeric,
    split_part(location_str, ',', 2)::numeric
  INTO lat, lon;

  -- Call Nominatim API to get location details
  SELECT content::jsonb INTO api_response
  FROM http_get('https://nominatim.openstreetmap.org/reverse?lat=' || lat || '&lon=' || lon || '&format=json');

  -- Extract city, state and country from response
  city := api_response->'address'->>'city';
  IF city IS NULL THEN
    city := api_response->'address'->>'town';
  END IF;
  IF city IS NULL THEN
    city := api_response->'address'->>'village';
  END IF;
  
  state := api_response->'address'->>'state';
  country := api_response->'address'->>'country';
  
  -- Return formatted location string
  IF city IS NOT NULL AND state IS NOT NULL AND country IS NOT NULL THEN
    RETURN city || ', ' || state || ', ' || country;
  ELSIF city IS NOT NULL AND country IS NOT NULL THEN
    RETURN city || ', ' || country;
  ELSIF state IS NOT NULL AND country IS NOT NULL THEN
    RETURN state || ', ' || country;
  ELSIF country IS NOT NULL THEN
    RETURN country;
  ELSE
    RETURN NULL;
  END IF;
END;
$$;

-- Function to get top routes by likes
CREATE OR REPLACE FUNCTION get_top_routes(limit_count integer)
RETURNS TABLE (
  id uuid,
  title text,
  likes_count bigint
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT 
    routes.id,
    routes.title,
    COUNT(route_ratings.id) as likes_count
  FROM routes
  LEFT JOIN route_ratings ON routes.id = route_ratings.route_id
  GROUP BY routes.id, routes.title
  ORDER BY likes_count DESC
  LIMIT limit_count;
$$;

-- Function to get top authors by route count
CREATE OR REPLACE FUNCTION get_top_authors(limit_count integer)
RETURNS TABLE (
  id uuid,
  username text,
  avatar_url text,
  location text,
  routes_count bigint
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT 
    users.id,
    users.username,
    users.avatar_url,
    get_city_country_from_location(users.location) as location,
    COUNT(routes.id) as routes_count
  FROM users
  LEFT JOIN routes ON users.id = routes.created_by
  GROUP BY users.id, users.username, users.avatar_url, users.location
  ORDER BY routes_count DESC
  LIMIT limit_count;
$$;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION get_city_country_from_location(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_routes(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_authors(integer) TO authenticated;

-- Add extension if not exists
CREATE EXTENSION IF NOT EXISTS http;