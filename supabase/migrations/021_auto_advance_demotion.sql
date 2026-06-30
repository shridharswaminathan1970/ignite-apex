-- 021_auto_advance_demotion.sql
-- Automatic stage advancement and demotion based on gate completion

-- Add fields to track automatic stage changes
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'auto_advanced_at') THEN
    ALTER TABLE public.opportunities ADD COLUMN auto_advanced_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'auto_demoted_at') THEN
    ALTER TABLE public.opportunities ADD COLUMN auto_demoted_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'last_auto_action') THEN
    ALTER TABLE public.opportunities ADD COLUMN last_auto_action TEXT;
  END IF;
END $$;

-- Function to check if IGNITE gates for qualify stage are met
CREATE OR REPLACE FUNCTION check_ignite_qualify_gates_met(opp_row public.opportunities)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    COALESCE(opp_row.gate_account_exists, false) AND
    COALESCE(opp_row.gate_contact_exists, false) AND
    COALESCE(opp_row.gate_prospect_engaged, false) AND
    COALESCE(opp_row.gate_quantified_pain, false)
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to check if IGNITE gates for discover stage are met
CREATE OR REPLACE FUNCTION check_ignite_discover_gates_met(opp_row public.opportunities)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    COALESCE(opp_row.gate_economic_buyer_identified, false) AND
    COALESCE(opp_row.gate_metrics_quantified, false) AND
    COALESCE(opp_row.gate_champion_emerging, false) AND
    COALESCE(opp_row.gate_pain_tied_to_outcome, false)
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to check if IGNITE gates for validate stage are met
CREATE OR REPLACE FUNCTION check_ignite_validate_gates_met(opp_row public.opportunities)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    COALESCE(opp_row.gate_demo_delivered, false) AND
    COALESCE(opp_row.gate_prospect_confirms_fit, false) AND
    COALESCE(opp_row.gate_decision_criteria_documented, false) AND
    COALESCE(opp_row.gate_decision_process_documented, false)
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to check if standard (BANT) gates are met
CREATE OR REPLACE FUNCTION check_standard_gates_met(opp_row public.opportunities)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    COALESCE(opp_row.gate_need_identified, false) AND
    COALESCE(opp_row.gate_authority_confirmed, false) AND
    COALESCE(opp_row.gate_budget_confirmed, false) AND
    COALESCE(opp_row.gate_timeline_locked, false)
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger function to auto-advance or demote based on gate changes
CREATE OR REPLACE FUNCTION trigger_auto_stage_management()
RETURNS TRIGGER AS $$
DECLARE
  current_stage TEXT;
  new_stage TEXT;
  can_advance BOOLEAN := false;
  should_demote BOOLEAN := false;
BEGIN
  current_stage := NEW.stage;

  -- Only process if methodology is set
  IF NEW.methodology IS NULL THEN
    RETURN NEW;
  END IF;

  -- IGNITE_APEX methodology logic
  IF NEW.methodology = 'ignite_apex' THEN
    -- Check for advancement
    IF current_stage = 'qualify' AND check_ignite_qualify_gates_met(NEW) THEN
      can_advance := true;
      new_stage := 'discover';
    ELSIF current_stage = 'discover' AND check_ignite_discover_gates_met(NEW) THEN
      can_advance := true;
      new_stage := 'validate';
    ELSIF current_stage = 'validate' AND check_ignite_validate_gates_met(NEW) THEN
      can_advance := true;
      new_stage := 'close';
    END IF;

    -- Check for demotion
    IF current_stage = 'discover' AND NOT check_ignite_qualify_gates_met(NEW) THEN
      should_demote := true;
      new_stage := 'qualify';
    ELSIF current_stage = 'validate' AND NOT check_ignite_discover_gates_met(NEW) THEN
      should_demote := true;
      new_stage := 'discover';
    ELSIF current_stage = 'close' AND NOT check_ignite_validate_gates_met(NEW) THEN
      should_demote := true;
      new_stage := 'validate';
    END IF;

  -- STANDARD methodology logic
  ELSIF NEW.methodology = 'standard' THEN
    -- For standard, just check if all BANT gates met to advance from qualify
    IF current_stage = 'qualify' AND check_standard_gates_met(NEW) THEN
      can_advance := true;
      new_stage := 'discover';
    END IF;

    -- Demote if BANT gates lost
    IF current_stage IN ('discover', 'validate', 'close') AND NOT check_standard_gates_met(NEW) THEN
      should_demote := true;
      new_stage := 'qualify';
    END IF;
  END IF;

  -- Apply advancement
  IF can_advance THEN
    NEW.stage := new_stage;
    NEW.auto_advanced_at := now();
    NEW.last_auto_action := 'advanced_to_' || new_stage;
    NEW.updated_at := now();

    -- Log activity
    INSERT INTO public.opportunity_activities (
      opportunity_id,
      activity_type,
      description,
      created_by
    )
    VALUES (
      NEW.id,
      'stage_change',
      'Automatically advanced from ' || current_stage || ' to ' || new_stage || ' (all gates met)',
      NEW.owner_id
    );
  END IF;

  -- Apply demotion
  IF should_demote THEN
    NEW.stage := new_stage;
    NEW.auto_demoted_at := now();
    NEW.last_auto_action := 'demoted_to_' || new_stage;
    NEW.updated_at := now();

    -- Log activity
    INSERT INTO public.opportunity_activities (
      opportunity_id,
      activity_type,
      description,
      created_by
    )
    VALUES (
      NEW.id,
      'stage_change',
      'Automatically demoted from ' || current_stage || ' to ' || new_stage || ' (critical gates lost)',
      NEW.owner_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on opportunities table
DROP TRIGGER IF EXISTS auto_stage_management_trigger ON public.opportunities;
CREATE TRIGGER auto_stage_management_trigger
  BEFORE UPDATE OF
    gate_account_exists, gate_contact_exists, gate_prospect_engaged, gate_quantified_pain,
    gate_economic_buyer_identified, gate_metrics_quantified, gate_champion_emerging, gate_pain_tied_to_outcome,
    gate_demo_delivered, gate_prospect_confirms_fit, gate_decision_criteria_documented, gate_decision_process_documented,
    gate_need_identified, gate_authority_confirmed, gate_budget_confirmed, gate_timeline_locked
  ON public.opportunities
  FOR EACH ROW
  EXECUTE FUNCTION trigger_auto_stage_management();

COMMENT ON FUNCTION trigger_auto_stage_management() IS 'Automatically advance or demote opportunities based on gate completion';
COMMENT ON COLUMN public.opportunities.auto_advanced_at IS 'Timestamp of last automatic stage advancement';
COMMENT ON COLUMN public.opportunities.auto_demoted_at IS 'Timestamp of last automatic stage demotion';
COMMENT ON COLUMN public.opportunities.last_auto_action IS 'Last automatic action taken (advanced_to_X or demoted_to_X)';
