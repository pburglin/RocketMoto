/*
  # Fix photo blob handling

  1. Changes
    - Ensure photo_blob column properly stores complete data URLs
    - Add validation for data URL format
    - Add check constraint to ensure either photo_url or photo_blob is present
    - Add indexes for better query performance

  2. Security
    - Maintain existing RLS policies
*/

-- Drop existing constraint if it exists
ALTER TABLE route_photos
DROP CONSTRAINT IF EXISTS photo_blob_format_check;

-- Add new constraints for photo storage
ALTER TABLE route_photos
ADD CONSTRAINT photo_content_check
CHECK (
  (photo_url IS NOT NULL AND photo_blob IS NULL) OR
  (photo_url IS NULL AND photo_blob IS NOT NULL)
);

ALTER TABLE route_photos
ADD CONSTRAINT photo_blob_format_check
CHECK (
  photo_blob IS NULL OR
  photo_blob LIKE 'data:image/%'
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS route_photos_route_id_idx ON route_photos(route_id);
CREATE INDEX IF NOT EXISTS route_photos_order_idx ON route_photos(route_id, "order");

-- Add comments
COMMENT ON CONSTRAINT photo_content_check ON route_photos IS 
  'Ensures either photo_url or photo_blob is present, but not both';

COMMENT ON CONSTRAINT photo_blob_format_check ON route_photos IS 
  'Ensures photo_blob contains a valid data URL with image MIME type';