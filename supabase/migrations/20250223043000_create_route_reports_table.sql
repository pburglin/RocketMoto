
CREATE TABLE route_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id UUID REFERENCES routes(id) NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  details TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE route_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to insert new reports" ON route_reports
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to select their own reports" ON route_reports
FOR SELECT
USING (user_id = auth.uid());

