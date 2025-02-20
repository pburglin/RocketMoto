/*
  # Add photo blob support to route_photos

  1. Changes
    - Make photo_url optional
    - Add photo_blob column for storing actual photo files
    - Add check constraint to ensure at least one of photo_url or photo_blob is present
    - Update existing records to maintain data integrity

  2. Security
    - Maintain existing RLS policies
*/

-- Make photo_url optional and add photo_blob
ALTER TABLE route_photos 
  ALTER COLUMN photo_url DROP NOT NULL,
  ADD COLUMN photo_blob bytea,
  ADD CONSTRAINT photo_content_check 
    CHECK (
      (photo_url IS NOT NULL AND photo_blob IS NULL) OR 
      (photo_url IS NULL AND photo_blob IS NOT NULL)
    );

-- Add comment explaining the constraint
COMMENT ON CONSTRAINT photo_content_check ON route_photos IS 
  'Ensures that either photo_url or photo_blob is present, but not both';