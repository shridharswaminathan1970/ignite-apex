-- Add org_id column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organisations(id);

-- Set org_id for existing users (link to first organisation)
UPDATE users 
SET org_id = (SELECT id FROM organisations LIMIT 1)
WHERE org_id IS NULL;
