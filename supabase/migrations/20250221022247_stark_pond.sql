/*
  # Add route distance calculation functions

  1. New Functions
    - `calculate_route_distance_from_point`: Calculates distance from a point to a route's start point
    - `get_routes_within_distance`: Returns routes within a specified distance from a point

  2. Changes
    - Added PostGIS extension check
    - Added helper functions for distance calculations
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
  SELECT start_point INTO route_start
  FROM routes
  WHERE id = route_id;

  RETURN ST_Distance(
    route_start::geography,
    ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
  ) / 1000; -- Convert to kilometers
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get routes within a specified distance
CREATE OR REPLACE FUNCTION get_routes_within_distance(
  p_lat double precision,
  p_lng double precision,
  p_distance double precision
) RETURNS SETOF routes AS $$
BEGIN
  RETURN QUERY
  SELECT routes.*
  FROM routes
  WHERE ST_Distance(
    start_point::geography,
    ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
  ) / 1000 <= p_distance;
END;
$$ LANGUAGE plpgsql STABLE;