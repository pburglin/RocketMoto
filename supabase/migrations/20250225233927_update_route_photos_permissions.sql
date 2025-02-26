-- Enable RLS on all tables
ALTER TABLE route_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE completed_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_ratings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON route_photos;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON route_photos;
DROP POLICY IF EXISTS "Enable delete for route owners" ON route_photos;
DROP POLICY IF EXISTS "Enable read access for completed routes" ON completed_routes;
DROP POLICY IF EXISTS "Enable write access for completed routes" ON completed_routes;
DROP POLICY IF EXISTS "Enable read access for all users" ON route_ratings;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON route_ratings;
DROP POLICY IF EXISTS "Enable update for own ratings" ON route_ratings;
DROP POLICY IF EXISTS "Enable delete for own ratings" ON route_ratings;

-- Route Photos Policies
CREATE POLICY "Enable read access for all users" 
ON route_photos FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Enable insert for authenticated users" 
ON route_photos FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete for route owners" 
ON route_photos FOR DELETE 
TO authenticated 
USING (
  auth.uid() IN (
    SELECT routes.created_by 
    FROM routes 
    WHERE routes.id = route_photos.route_id
  )
);

-- Completed Routes Policies
CREATE POLICY "Enable read access for completed routes"
ON completed_routes FOR SELECT
TO public
USING (true);

CREATE POLICY "Enable write access for completed routes"
ON completed_routes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete access for completed routes"
ON completed_routes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Route Ratings Policies
CREATE POLICY "Enable read access for all users"
ON route_ratings FOR SELECT
TO public
USING (true);

CREATE POLICY "Enable insert for authenticated users"
ON route_ratings FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for own ratings"
ON route_ratings FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete for own ratings"
ON route_ratings FOR DELETE
TO authenticated
USING (auth.uid() = user_id);