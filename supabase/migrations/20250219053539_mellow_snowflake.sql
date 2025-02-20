/*
  # Add route photos support

  1. New Tables
    - `route_photos`
      - `id` (uuid, primary key)
      - `route_id` (uuid, references routes)
      - `photo_url` (text)
      - `caption` (text)
      - `created_at` (timestamp)
      - `order` (integer) for controlling photo order

  2. Security
    - Enable RLS on `route_photos` table
    - Add policies for:
      - Everyone can view photos
      - Route creators can manage photos
*/

CREATE TABLE route_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid REFERENCES routes(id) ON DELETE CASCADE NOT NULL,
  photo_url text NOT NULL,
  caption text,
  "order" integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE route_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Route photos are viewable by everyone"
  ON route_photos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Route creators can manage photos"
  ON route_photos
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM routes
      WHERE routes.id = route_photos.route_id
      AND routes.created_by = auth.uid()
    )
  );