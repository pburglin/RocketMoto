/*
  # Add distance unit preference to users table

  1. Changes
    - Add `distance_unit` column to `users` table with values 'km' or 'mi'
    - Set default value to 'km'
    - Add check constraint to ensure valid values

  2. Notes
    - Existing users will default to kilometers
    - Units are either 'km' (kilometers) or 'mi' (miles)
*/

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'distance_unit'
  ) THEN
    ALTER TABLE users
    ADD COLUMN distance_unit text NOT NULL DEFAULT 'km'
    CHECK (distance_unit IN ('km', 'mi'));

    COMMENT ON COLUMN users.distance_unit IS 'User''s preferred distance unit (km/mi)';
  END IF;
END $$;