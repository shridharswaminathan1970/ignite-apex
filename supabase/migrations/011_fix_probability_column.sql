-- 011_fix_probability_column.sql
-- Fix probability column - was created as GENERATED, need it to be updatable

-- Drop the generated column
ALTER TABLE public.opportunities DROP COLUMN IF EXISTS probability;

-- Recreate as a normal column with default
ALTER TABLE public.opportunities ADD COLUMN probability INTEGER DEFAULT 0;

-- Add constraint
ALTER TABLE public.opportunities ADD CONSTRAINT valid_probability CHECK (probability >= 0 AND probability <= 100);

-- Add index
CREATE INDEX IF NOT EXISTS idx_opportunities_probability ON public.opportunities(probability);

COMMENT ON COLUMN public.opportunities.probability IS 'Close probability 0-100. Can be auto-calculated from probe_tier or manually set.';
