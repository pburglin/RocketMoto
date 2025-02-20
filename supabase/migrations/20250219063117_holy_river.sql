/*
  # Add theme preference to users table

  1. Changes
    - Add theme column to users table with default 'light'
    - Add check constraint to ensure valid theme values
*/

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'theme'
  ) THEN
    ALTER TABLE users
    ADD COLUMN theme text NOT NULL DEFAULT 'light'
    CHECK (theme IN ('light', 'dark'));

    COMMENT ON COLUMN users.theme IS 'User''s preferred theme (light/dark)';
  END IF;
END $$;