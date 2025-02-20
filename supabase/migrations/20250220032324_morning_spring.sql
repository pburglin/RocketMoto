/*
  # Add Route Bookmarks

  1. New Tables
    - `route_bookmarks`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `route_id` (uuid, references routes)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `route_bookmarks` table
    - Add policies for authenticated users to manage their bookmarks
*/

CREATE TABLE route_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  route_id uuid REFERENCES routes(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, route_id)
);

ALTER TABLE route_bookmarks ENABLE ROW LEVEL SECURITY;

-- Users can view their own bookmarks
CREATE POLICY "Users can view own bookmarks"
  ON route_bookmarks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can add bookmarks
CREATE POLICY "Users can add bookmarks"
  ON route_bookmarks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can remove bookmarks
CREATE POLICY "Users can remove bookmarks"
  ON route_bookmarks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);