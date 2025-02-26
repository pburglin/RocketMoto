-- Update route_photos permissions to allow any authenticated user to add photos
ALTER TABLE route_photos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON route_photos;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON route_photos;
DROP POLICY IF EXISTS "Enable delete for route owners" ON route_photos;

-- Create new policies
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