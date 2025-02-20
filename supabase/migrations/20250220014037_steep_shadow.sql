/*
  # Update RLS policies for anonymous access

  1. Changes
    - Allow anonymous users to read routes, route tags, and route photos
    - Keep write operations restricted to authenticated users
    - Keep ratings and comments restricted to authenticated users

  2. Security
    - Anonymous users can only read public data
    - No write access for anonymous users
    - Maintains existing authenticated user policies
*/

-- Update routes table policies
ALTER TABLE routes DROP POLICY IF EXISTS "Routes are viewable by everyone";
CREATE POLICY "Routes are viewable by everyone"
  ON routes FOR SELECT
  USING (true);

-- Update route_tags table policies
ALTER TABLE route_tags DROP POLICY IF EXISTS "Route tags are viewable by everyone";
CREATE POLICY "Route tags are viewable by everyone"
  ON route_tags FOR SELECT
  USING (true);

-- Update route_photos table policies
ALTER TABLE route_photos DROP POLICY IF EXISTS "Route photos are viewable by everyone";
CREATE POLICY "Route photos are viewable by everyone"
  ON route_photos FOR SELECT
  USING (true);

-- Keep existing policies for authenticated users
ALTER TABLE routes DROP POLICY IF EXISTS "Users can create routes";
CREATE POLICY "Users can create routes"
  ON routes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

ALTER TABLE routes DROP POLICY IF EXISTS "Users can update own routes";
CREATE POLICY "Users can update own routes"
  ON routes FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

-- Ensure ratings and comments remain restricted to authenticated users
ALTER TABLE route_ratings DROP POLICY IF EXISTS "Users can view all ratings";
CREATE POLICY "Users can view all ratings"
  ON route_ratings FOR SELECT
  TO authenticated
  USING (true);

ALTER TABLE route_comments DROP POLICY IF EXISTS "Comments are viewable by everyone";
CREATE POLICY "Comments are viewable by everyone"
  ON route_comments FOR SELECT
  TO authenticated
  USING (true);