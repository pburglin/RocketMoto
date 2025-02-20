/*
  # Fix photo blob storage and handling

  1. Changes
    - Create temporary column to store text data
    - Convert existing bytea data to base64 text
    - Drop old column and rename new one
    - Add constraint for data URL format
*/

-- Create temporary column for the conversion
ALTER TABLE route_photos 
ADD COLUMN photo_blob_text text;

-- Convert existing bytea data to base64 text with proper data URL prefix
DO $$
BEGIN
  UPDATE route_photos
  SET photo_blob_text = 
    CASE 
      WHEN photo_blob IS NOT NULL THEN 
        'data:image/jpeg;base64,' || encode(photo_blob, 'base64')
      ELSE NULL
    END
  WHERE photo_blob IS NOT NULL;
END $$;

-- Drop old bytea column
ALTER TABLE route_photos 
DROP COLUMN photo_blob;

-- Rename new text column (correct PostgreSQL syntax)
ALTER TABLE route_photos 
RENAME COLUMN photo_blob_text TO photo_blob;

-- Add constraint for data URL format
ALTER TABLE route_photos
ADD CONSTRAINT photo_blob_format_check
CHECK (
  photo_blob IS NULL OR
  photo_blob LIKE 'data:image/%'
);

-- Add comment explaining the constraint
COMMENT ON CONSTRAINT photo_blob_format_check ON route_photos IS 
  'Ensures photo_blob contains a valid data URL with image MIME type';