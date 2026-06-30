-- 012_add_account_contact_links.sql
-- Add account_id and contact_id foreign keys to opportunities table

DO $$
BEGIN
  -- Add account_id link
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'account_id') THEN
    ALTER TABLE public.opportunities ADD COLUMN account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL;
  END IF;

  -- Add contact_id link
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'contact_id') THEN
    ALTER TABLE public.opportunities ADD COLUMN contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL;
  END IF;

  -- Add account_name for display
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'account_name') THEN
    ALTER TABLE public.opportunities ADD COLUMN account_name TEXT;
  END IF;
END $$;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_opportunities_account ON public.opportunities(account_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_contact ON public.opportunities(contact_id);

COMMENT ON COLUMN public.opportunities.account_id IS 'Link to accounts table - shared data layer';
COMMENT ON COLUMN public.opportunities.contact_id IS 'Link to contacts table - shared data layer';
