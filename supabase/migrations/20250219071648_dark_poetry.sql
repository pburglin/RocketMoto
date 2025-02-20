/*
  # Add route ratings system

  1. Changes
    - Add rating_type column to route_ratings table
    - Add rating counts to routes table
    - Add functions to update rating counts
    - Add trigger to maintain rating counts

  2. Security
    - Update RLS policies for route_ratings
*/

-- Add rating counts to routes table
ALTER TABLE routes
ADD COLUMN IF NOT EXISTS upvotes integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS downvotes integer NOT NULL DEFAULT 0;

-- Modify route_ratings table
ALTER TABLE route_ratings
ADD COLUMN IF NOT EXISTS rating_type text NOT NULL CHECK (rating_type IN ('up', 'down'));

-- Function to update route rating counts
CREATE OR REPLACE FUNCTION update_route_rating_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment the appropriate counter
    IF NEW.rating_type = 'up' THEN
      UPDATE routes SET upvotes = upvotes + 1 WHERE id = NEW.route_id;
    ELSE
      UPDATE routes SET downvotes = downvotes + 1 WHERE id = NEW.route_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement the appropriate counter
    IF OLD.rating_type = 'up' THEN
      UPDATE routes SET upvotes = upvotes - 1 WHERE id = OLD.route_id;
    ELSE
      UPDATE routes SET downvotes = downvotes - 1 WHERE id = OLD.route_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' AND OLD.rating_type != NEW.rating_type THEN
    -- Switch the rating type
    IF NEW.rating_type = 'up' THEN
      UPDATE routes SET upvotes = upvotes + 1, downvotes = downvotes - 1 WHERE id = NEW.route_id;
    ELSE
      UPDATE routes SET upvotes = upvotes - 1, downvotes = downvotes + 1 WHERE id = NEW.route_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for rating counts
DROP TRIGGER IF EXISTS update_route_rating_counts_trigger ON route_ratings;
CREATE TRIGGER update_route_rating_counts_trigger
AFTER INSERT OR UPDATE OR DELETE ON route_ratings
FOR EACH ROW
EXECUTE FUNCTION update_route_rating_counts();

-- Update RLS policies
ALTER TABLE route_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all ratings" ON route_ratings;
CREATE POLICY "Users can view all ratings"
ON route_ratings FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Users can rate routes once" ON route_ratings;
CREATE POLICY "Users can rate routes once"
ON route_ratings FOR INSERT
TO authenticated
WITH CHECK (
  NOT EXISTS (
    SELECT 1 FROM route_ratings
    WHERE route_id = route_ratings.route_id
    AND user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update own ratings" ON route_ratings;
CREATE POLICY "Users can update own ratings"
ON route_ratings FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own ratings" ON route_ratings;
CREATE POLICY "Users can delete own ratings"
ON route_ratings FOR DELETE
TO authenticated
USING (user_id = auth.uid());