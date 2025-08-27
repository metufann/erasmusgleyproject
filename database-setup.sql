-- Database setup for Erasmus+ Photo Exhibition
-- Run this in your Supabase SQL editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Countries table
CREATE TABLE countries (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  flag_svg_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Access Codes table (per country)
CREATE TABLE country_access_codes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  country_id BIGINT REFERENCES countries(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  max_uses INT,
  used_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin Delete Code table (global, for all countries)
CREATE TABLE admin_delete_code (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code_hash TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT 'Global delete code for all countries',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Submissions table
CREATE TABLE submissions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  country_id BIGINT REFERENCES countries(id) ON DELETE SET NULL,
  image_path TEXT NOT NULL,
  caption TEXT,
  author_name TEXT,
  story TEXT,
  original_width INTEGER,
  original_height INTEGER,
  approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE country_access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_delete_code ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY read_approved ON submissions FOR SELECT USING (approved = true);
CREATE POLICY server_write_only ON submissions FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY codes_server_only ON country_access_codes FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY countries_public ON countries FOR SELECT USING (true);

CREATE POLICY admin_code_server_only ON admin_delete_code FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Create storage bucket for submissions
INSERT INTO storage.buckets (id, name, public) VALUES ('submissions', 'submissions', true);

-- Storage policies
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'submissions');
CREATE POLICY "Service Role Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'submissions' AND auth.role() = 'service_role');

-- Sample data - 5 countries
INSERT INTO countries (slug, name, flag_svg_url, is_active) VALUES
('turkey', 'Turkey', 'https://flagcdn.com/tr.svg', true),
('france', 'France', 'https://flagcdn.com/fr.svg', true),
('ukraine', 'Ukraine', 'https://flagcdn.com/ua.svg', true),
('lebanon', 'Lebanon', 'https://flagcdn.com/lb.svg', true),
('georgia', 'Georgia', 'https://flagcdn.com/ge.svg', true);

-- Sample access codes - Each country has a different code
-- Turkey: "turkey2024"
-- France: "france2024" 
-- Ukraine: "ukraine2024"
-- Lebanon: "lebanon2024"
-- Georgia: "georgia2024"
INSERT INTO country_access_codes (country_id, code_hash, expires_at, max_uses) VALUES
(1, '1f8bd2355833f4b1ded19547dafecc69278a894a', NULL, 100), -- turkey2024
(2, '77cfc9aaf2470e2e8286408f57b458d596a1c308', NULL, 100), -- france2024
(3, '9c197efe3e794094246fc99d0d1b36097e8a97b7', NULL, 100), -- ukraine2024
(4, '5f11674f9e5389591c28a701014cbfeb45854e6f', NULL, 100), -- lebanon2024
(5, '11acfd6df6202e9fc3150b259050de80a4eb6de0', NULL, 100); -- georgia2024

-- Admin delete code - "sirdanmumbar" (global delete code for all countries)
INSERT INTO admin_delete_code (code_hash, description) VALUES
('d892297c15c1db963f9b7bccdcb0d282bc312d31', 'Global delete code: sirdanmumbar');

-- Create indexes for better performance
CREATE INDEX idx_submissions_country_id ON submissions(country_id);
CREATE INDEX idx_submissions_approved ON submissions(approved);
CREATE INDEX idx_country_access_codes_country_id ON country_access_codes(country_id);
CREATE INDEX idx_countries_slug ON countries(slug);
CREATE INDEX idx_countries_active ON countries(is_active); 