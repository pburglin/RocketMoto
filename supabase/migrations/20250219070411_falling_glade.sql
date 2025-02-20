/*
  # Add route search functionality

  1. Changes
    - Add text search vector column to routes table
    - Create trigger to update search vector
    - Add index for efficient text search
    - Add function to calculate distance between points

  2. Notes
    - Uses PostgreSQL full-text search for title and description
    - Adds GiST index for efficient text search
    - Adds function to calculate distance between points using PostGIS
*/

-- Add text search vector column
ALTER TABLE routes
ADD COLUMN IF NOT EXISTS search_vector tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'B')
) STORED;

-- Add GiST index for text search
CREATE INDEX IF NOT EXISTS routes_search_idx ON routes USING GiST (search_vector);

-- Function to calculate distance between points in kilometers
CREATE OR REPLACE FUNCTION calculate_distance_km(
  point1 geometry(Point, 4326),
  point2 geometry(Point, 4326)
) RETURNS double precision AS $$
BEGIN
  RETURN ST_Distance(
    point1::geography,
    point2::geography
  ) / 1000; -- Convert meters to kilometers
END;
$$ LANGUAGE plpgsql IMMUTABLE;