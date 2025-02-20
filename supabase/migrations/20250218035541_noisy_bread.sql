/*
  # Initial Schema for Motorcycle Route Explorer

  1. New Tables
    - users
      - id (uuid, primary key)
      - username (text)
      - avatar_url (text)
      - created_at (timestamp)
    
    - routes
      - id (uuid, primary key)
      - title (text)
      - description (text)
      - start_point (point)
      - end_point (point)
      - distance (numeric)
      - duration (interval)
      - created_by (uuid, foreign key)
      - created_at (timestamp)
    
    - route_tags
      - id (uuid, primary key)
      - route_id (uuid, foreign key)
      - tag (text)
    
    - route_ratings
      - id (uuid, primary key)
      - route_id (uuid, foreign key)
      - user_id (uuid, foreign key)
      - rating (boolean)
      - created_at (timestamp)
    
    - route_comments
      - id (uuid, primary key)
      - route_id (uuid, foreign key)
      - user_id (uuid, foreign key)
      - content (text)
      - created_at (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Users table
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT auth.uid(),
  username text UNIQUE NOT NULL,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all profiles"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Routes table
CREATE TABLE routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  start_point geometry(Point, 4326) NOT NULL,
  end_point geometry(Point, 4326) NOT NULL,
  distance numeric NOT NULL,
  duration interval NOT NULL,
  created_by uuid REFERENCES users(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Routes are viewable by everyone"
  ON routes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create routes"
  ON routes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own routes"
  ON routes FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

-- Route tags
CREATE TABLE route_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid REFERENCES routes(id) NOT NULL,
  tag text NOT NULL,
  UNIQUE(route_id, tag)
);

ALTER TABLE route_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Route tags are viewable by everyone"
  ON route_tags FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Route creators can manage tags"
  ON route_tags
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM routes
      WHERE routes.id = route_tags.route_id
      AND routes.created_by = auth.uid()
    )
  );

-- Route ratings
CREATE TABLE route_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid REFERENCES routes(id) NOT NULL,
  user_id uuid REFERENCES users(id) NOT NULL,
  rating boolean NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(route_id, user_id)
);

ALTER TABLE route_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ratings are viewable by everyone"
  ON route_ratings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can rate routes"
  ON route_ratings
  TO authenticated
  USING (auth.uid() = user_id);

-- Route comments
CREATE TABLE route_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid REFERENCES routes(id) NOT NULL,
  user_id uuid REFERENCES users(id) NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE route_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone"
  ON route_comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create comments"
  ON route_comments
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON route_comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);