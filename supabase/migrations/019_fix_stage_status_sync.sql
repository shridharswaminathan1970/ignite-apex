-- 019_fix_stage_status_sync.sql
-- Fix critical bug: stage and status fields out of sync
-- Closed Won deals still showing status='Open', breaking metrics

-- BACKFILL: Sync existing data
UPDATE public.opportunities
SET
  pipeline_status = 'Won',
  probability = 100
WHERE pipeline_stage = 'Closed Won' AND pipeline_status != 'Won';

UPDATE public.opportunities
SET
  pipeline_status = 'Lost',
  probability = 0
WHERE pipeline_stage = 'Closed Lost' AND pipeline_status != 'Lost';

UPDATE public.opportunities
SET pipeline_status = 'Open'
WHERE pipeline_stage NOT IN ('Closed Won', 'Closed Lost')
  AND pipeline_status NOT IN ('Open', 'Won', 'Lost');

-- Add a database trigger to enforce sync (prevent future drift)
CREATE OR REPLACE FUNCTION sync_stage_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-sync status when stage changes
  IF NEW.pipeline_stage = 'Closed Won' THEN
    NEW.pipeline_status := 'Won';
    NEW.probability := 100;
  ELSIF NEW.pipeline_stage = 'Closed Lost' THEN
    NEW.pipeline_status := 'Lost';
    NEW.probability := 0;
  ELSIF NEW.pipeline_stage != OLD.pipeline_stage THEN
    -- Any other stage change → ensure status is Open
    IF NEW.pipeline_status NOT IN ('Won', 'Lost') THEN
      NEW.pipeline_status := 'Open';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists (in case we're re-running)
DROP TRIGGER IF EXISTS enforce_stage_status_sync ON public.opportunities;

-- Create trigger on opportunities table
CREATE TRIGGER enforce_stage_status_sync
  BEFORE UPDATE ON public.opportunities
  FOR EACH ROW
  WHEN (OLD.pipeline_stage IS DISTINCT FROM NEW.pipeline_stage)
  EXECUTE FUNCTION sync_stage_status();

COMMENT ON FUNCTION sync_stage_status() IS 'Auto-sync pipeline_status when pipeline_stage changes to keep them consistent';
