-- Add team leader functionality
ALTER TABLE teams ADD COLUMN IF NOT EXISTS team_leader_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_teams_team_leader ON teams(team_leader_id);

COMMENT ON COLUMN teams.team_leader_id IS 'User ID of the team leader (super_admin or admin). Defaults to super_admin if not set.';
