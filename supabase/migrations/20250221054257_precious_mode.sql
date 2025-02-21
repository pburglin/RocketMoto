/*
  # Add route distance calculation functions

  1. New Functions
    - `get_routes_within_distance`: Returns routes within a specified distance from a point
    - `calculate_route_distance_from_point`: Calculates distance between a point and a route's start point

  2. Changes
    - Ensures PostGIS extension is available
    - Adds proper error handling and validation
    - Includes documentation comments
*/

-- Ensure PostGIS is available
CREATE EXTENSION IF NOT EXISTS postgis;

-- Function to calculate distance from a point to a route's start point
CREATE OR REPLACE FUNCTION calculate_route_distance_from_point(
  route_id uuid,
  p_lat double precision,
  p_lng double precision
) RETURNS double precision AS $$
DECLARE
  route_start geometry;
BEGIN
  -- Input validation
  IF p_lat < -90 OR p_lat > 90 THEN
    RAISE EXCEPTION 'Invalid latitude: %', p_lat;
  END IF;
  IF p_lng < -180 OR p_lng > 180 THEN
    RAISE EXCEPTION 'Invalid longitude: %', p_lng;
  END IF;

  -- Get route's start point
  SELECT start_point INTO route_start
  FROM routes
  WHERE id = route_id;

  IF route_start IS NULL THEN
    RAISE EXCEPTION 'Route not found: %', route_id;
  END IF;

  -- Calculate distance in kilometers
  RETURN ST_Distance(
    route_start::geography,
    ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
  ) / 1000;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get routes within a specified distance
CREATE OR REPLACE FUNCTION get_routes_within_distance(
  p_lat double precision,
  p_lng double precision,
  p_distance double precision
) RETURNS TABLE (
  id uuid,
  distance_km double precision
) AS $$
BEGIN
  -- Input validation
  IF p_lat < -90 OR p_lat > 90 THEN
    RAISE EXCEPTION 'Invalid latitude: %', p_lat;
  END IF;
  IF p_lng < -180 OR p_lng > 180 THEN
    RAISE EXCEPTION 'Invalid longitude: %', p_lng;
  END IF;
  IF p_distance <= 0 THEN
    RAISE EXCEPTION 'Distance must be positive: %', p_distance;
  END IF;

  -- Return routes within distance
  RETURN QUERY
  SELECT 
    r.id,
    ST_Distance(
      r.start_point::geography,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
    ) / 1000 AS distance_km
  FROM routes r
  WHERE ST_DWithin(
    r.start_point::geography,
    ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
    p_distance * 1000 -- Convert km to meters
  );
END;
$$ LANGUAGE plpgsql STABLE;