/*
  # Add location column to users table

  1. Changes
    - Add `location` column to `users` table to store user's geographical location as text
    - Column allows NULL values for users who haven't set their location
    - Add comment explaining the expected format

  2. Security
    - Inherits existing RLS policies from users table
*/

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'location'
  ) THEN
    ALTER TABLE users
    ADD COLUMN location text,
    ADD CONSTRAINT location_format CHECK (
      location IS NULL OR 
      location ~ '^-?\d+\.\d+,\s*-?\d+\.\d+$'
    );

    COMMENT ON COLUMN users.location IS 'User''s location in "latitude, longitude" format';
  END IF;
END $$;