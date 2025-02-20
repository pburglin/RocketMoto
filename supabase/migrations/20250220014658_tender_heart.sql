/*
  # Update RLS policies for public access
  
  1. Changes
    - Make routes, tags, and photos publicly viewable
    - Keep authenticated-only requirements for creating/updating content
    - Keep authenticated-only access for ratings and comments
  
  2. Implementation
    - Uses DO blocks to safely drop and recreate policies
    - Maintains existing authenticated user policies
*/

-- Routes table policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Routes are viewable by everyone" ON routes;
    DROP POLICY IF EXISTS "Users can create routes" ON routes;
    DROP POLICY IF EXISTS "Users can update own routes" ON routes;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Routes are viewable by everyone"
  ON routes FOR SELECT
  USING (true);

CREATE POLICY "Users can create routes"
  ON routes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own routes"
  ON routes FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

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
  TO authenticated
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
  TO authenticated
  USING (true);