/*
  # Add completed routes tracking

  1. New Tables
    - `completed_routes`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `route_id` (uuid, references routes)
      - `completed_at` (timestamptz)
  2. Security
    - Enable RLS on `completed_routes` table
    - Add policies for users to manage their completed routes
*/

CREATE TABLE completed_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  route_id uuid REFERENCES routes(id) NOT NULL,
  completed_at timestamptz DEFAULT now(),
  UNIQUE(user_id, route_id)
);

ALTER TABLE completed_routes ENABLE ROW LEVEL SECURITY;

-- Users can view their own completed routes
CREATE POLICY "Users can view own completed routes"
  ON completed_routes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can mark routes as completed
CREATE POLICY "Users can mark routes as completed"
  ON completed_routes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can remove routes from completed
CREATE POLICY "Users can remove completed routes"
  ON completed_routes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);