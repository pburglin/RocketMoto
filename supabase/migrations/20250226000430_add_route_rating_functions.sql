-- Function to increment route rating (upvotes or downvotes)
CREATE OR REPLACE FUNCTION increment_route_rating(p_route_id UUID, p_is_upvote BOOLEAN)
RETURNS VOID AS $$
BEGIN
  IF p_is_upvote THEN
    UPDATE routes
    SET upvotes = upvotes + 1
    WHERE id = p_route_id;
  ELSE
    UPDATE routes
    SET downvotes = downvotes + 1
    WHERE id = p_route_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement route rating (upvotes or downvotes)
CREATE OR REPLACE FUNCTION decrement_route_rating(p_route_id UUID, p_is_upvote BOOLEAN)
RETURNS VOID AS $$
BEGIN
  IF p_is_upvote THEN
    UPDATE routes
    SET upvotes = GREATEST(0, upvotes - 1)
    WHERE id = p_route_id;
  ELSE
    UPDATE routes
    SET downvotes = GREATEST(0, downvotes - 1)
    WHERE id = p_route_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update route rating (when changing from upvote to downvote or vice versa)
CREATE OR REPLACE FUNCTION update_route_rating(p_route_id UUID, p_old_is_upvote BOOLEAN, p_new_is_upvote BOOLEAN)
RETURNS VOID AS $$
BEGIN
  IF p_old_is_upvote THEN
    UPDATE routes
    SET upvotes = GREATEST(0, upvotes - 1),
        downvotes = downvotes + 1
    WHERE id = p_route_id;
  ELSE
    UPDATE routes
    SET downvotes = GREATEST(0, downvotes - 1),
        upvotes = upvotes + 1
    WHERE id = p_route_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION increment_route_rating TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_route_rating TO authenticated;
GRANT EXECUTE ON FUNCTION update_route_rating TO authenticated;

-- Disable existing trigger
DROP TRIGGER IF EXISTS update_route_rating_counts_trigger ON route_ratings;