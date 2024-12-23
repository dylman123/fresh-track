-- Connect to your database first
\c neondb;

-- Create UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create items table
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  expiry_date DATE NOT NULL,
  email TEXT NOT NULL,
  notification_sent BOOLEAN DEFAULT FALSE,
  category TEXT NOT NULL,
  storage_type TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_items_expiry ON items(expiry_date);
CREATE INDEX idx_items_notification ON items(notification_sent);
CREATE INDEX idx_items_email ON items(email);

-- Grant permissions
GRANT ALL PRIVILEGES ON TABLE items TO neondb_owner;