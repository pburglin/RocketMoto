/*
  # Update RLS policies for anonymous access

  1. Changes
    - Allow anonymous users to read routes, route tags, route photos, ratings, and comments
    - Keep write operations restricted to authenticated users
    - Remove TO authenticated from SELECT policies

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

-- Update route_ratings table policies
ALTER TABLE route_ratings DROP POLICY IF EXISTS "Users can view all ratings";
CREATE POLICY "Users can view all ratings"
  ON route_ratings FOR SELECT
  USING (true);

-- Update route_comments table policies
ALTER TABLE route_comments DROP POLICY IF EXISTS "Comments are viewable by everyone";
CREATE POLICY "Comments are viewable by everyone"
  ON route_comments FOR SELECT
  USING (true);

-- Update users table policies to allow reading public profile info
ALTER TABLE users DROP POLICY IF EXISTS "Users can read all profiles";
CREATE POLICY "Users can read all profiles"
  ON users FOR SELECT
  USING (true);