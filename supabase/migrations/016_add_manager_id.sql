-- 016_add_manager_id.sql
-- Add manager_id field to users table for hierarchical org structure

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'manager_id') THEN
    ALTER TABLE public.users ADD COLUMN manager_id UUID REFERENCES public.users(id);
  END IF;
END $$;

COMMENT ON COLUMN public.users.manager_id IS 'ID of this user''s manager - for hierarchical reporting';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_manager_id ON public.users(manager_id);
