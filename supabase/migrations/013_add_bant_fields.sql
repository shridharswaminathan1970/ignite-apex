-- 013_add_bant_fields.sql
-- Add BANT qualification fields for Standard CRM methodology

DO $$
BEGIN
  -- BANT qualification fields (for methodology='standard')
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'bant_budget') THEN
    ALTER TABLE public.opportunities ADD COLUMN bant_budget TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'bant_authority') THEN
    ALTER TABLE public.opportunities ADD COLUMN bant_authority TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'bant_need') THEN
    ALTER TABLE public.opportunities ADD COLUMN bant_need TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'bant_timeline') THEN
    ALTER TABLE public.opportunities ADD COLUMN bant_timeline TEXT;
  END IF;
END $$;

COMMENT ON COLUMN public.opportunities.bant_budget IS 'BANT Budget qualification (Standard methodology)';
COMMENT ON COLUMN public.opportunities.bant_authority IS 'BANT Authority qualification (Standard methodology)';
COMMENT ON COLUMN public.opportunities.bant_need IS 'BANT Need qualification (Standard methodology)';
COMMENT ON COLUMN public.opportunities.bant_timeline IS 'BANT Timeline qualification (Standard methodology)';
