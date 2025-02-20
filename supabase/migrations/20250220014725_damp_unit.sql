/*
  # Update RLS policies for public access
  
  1. Changes
    - Make routes, tags, photos, and user profiles publicly viewable
    - Keep authenticated-only requirements for ratings and comments
  
  2. Implementation
    - Uses DO blocks to safely drop and recreate policies
    - Makes core content publicly accessible
    - Maintains authentication requirements for interactive features
*/

-- Routes table policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Routes are viewable by everyone" ON routes;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Routes are viewable by everyone"
  ON routes FOR SELECT
  USING (true);

-- Route tags table policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Route tags are viewable by everyone" ON route_tags;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Route tags are viewable by everyone"
  ON route_tags FOR SELECT
  USING (true);

-- Route photos table policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Route photos are viewable by everyone" ON route_photos;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Route photos are viewable by everyone"
  ON route_photos FOR SELECT
  USING (true);

-- Route ratings table policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view all ratings" ON route_ratings;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Users can view all ratings"
  ON route_ratings FOR SELECT
  USING (true);

-- Route comments table policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Comments are viewable by everyone" ON route_comments;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Comments are viewable by everyone"
  ON route_comments FOR SELECT
  USING (true);

-- Users table policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can read all profiles" ON users;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Users can read all profiles"
  ON users FOR SELECT
  USING (true);