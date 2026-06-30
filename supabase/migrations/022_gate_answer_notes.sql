-- 022_gate_answer_notes.sql
-- Add _notes fields for each gate to store structured answers

DO $$
BEGIN
  -- 4U notes
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'demand_4u_unworkable_notes') THEN
    ALTER TABLE public.opportunities ADD COLUMN demand_4u_unworkable_notes TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'demand_4u_urgent_notes') THEN
    ALTER TABLE public.opportunities ADD COLUMN demand_4u_urgent_notes TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'demand_4u_unavoidable_notes') THEN
    ALTER TABLE public.opportunities ADD COLUMN demand_4u_unavoidable_notes TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'demand_4u_underserved_notes') THEN
    ALTER TABLE public.opportunities ADD COLUMN demand_4u_underserved_notes TEXT;
  END IF;

  -- Qualification gates notes
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'gate_account_exists_notes') THEN
    ALTER TABLE public.opportunities ADD COLUMN gate_account_exists_notes TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'gate_contact_exists_notes') THEN
    ALTER TABLE public.opportunities ADD COLUMN gate_contact_exists_notes TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'gate_prospect_engaged_notes') THEN
    ALTER TABLE public.opportunities ADD COLUMN gate_prospect_engaged_notes TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'gate_quantified_pain_notes') THEN
    ALTER TABLE public.opportunities ADD COLUMN gate_quantified_pain_notes TEXT;
  END IF;

  -- Discovery gates notes
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'gate_economic_buyer_identified_notes') THEN
    ALTER TABLE public.opportunities ADD COLUMN gate_economic_buyer_identified_notes TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'gate_metrics_quantified_notes') THEN
    ALTER TABLE public.opportunities ADD COLUMN gate_metrics_quantified_notes TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'gate_champion_emerging_notes') THEN
    ALTER TABLE public.opportunities ADD COLUMN gate_champion_emerging_notes TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'gate_pain_tied_to_outcome_notes') THEN
    ALTER TABLE public.opportunities ADD COLUMN gate_pain_tied_to_outcome_notes TEXT;
  END IF;

  -- Demo/Validate gates notes
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'gate_demo_delivered_notes') THEN
    ALTER TABLE public.opportunities ADD COLUMN gate_demo_delivered_notes TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'gate_prospect_confirms_fit_notes') THEN
    ALTER TABLE public.opportunities ADD COLUMN gate_prospect_confirms_fit_notes TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'gate_decision_criteria_documented_notes') THEN
    ALTER TABLE public.opportunities ADD COLUMN gate_decision_criteria_documented_notes TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'gate_decision_process_documented_notes') THEN
    ALTER TABLE public.opportunities ADD COLUMN gate_decision_process_documented_notes TEXT;
  END IF;

  -- Proposal gates notes
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'gate_proposal_delivered_notes') THEN
    ALTER TABLE public.opportunities ADD COLUMN gate_proposal_delivered_notes TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'gate_business_case_to_eb_notes') THEN
    ALTER TABLE public.opportunities ADD COLUMN gate_business_case_to_eb_notes TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'gate_roi_tied_to_metrics_notes') THEN
    ALTER TABLE public.opportunities ADD COLUMN gate_roi_tied_to_metrics_notes TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'gate_paper_process_mapped_notes') THEN
    ALTER TABLE public.opportunities ADD COLUMN gate_paper_process_mapped_notes TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'gate_meddpicc_complete_notes') THEN
    ALTER TABLE public.opportunities ADD COLUMN gate_meddpicc_complete_notes TEXT;
  END IF;

  -- Negotiation gates notes
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'gate_verbal_commitment_notes') THEN
    ALTER TABLE public.opportunities ADD COLUMN gate_verbal_commitment_notes TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'gate_terms_in_negotiation_notes') THEN
    ALTER TABLE public.opportunities ADD COLUMN gate_terms_in_negotiation_notes TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'gate_mutual_close_plan_notes') THEN
    ALTER TABLE public.opportunities ADD COLUMN gate_mutual_close_plan_notes TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'gate_champion_eb_aligned_notes') THEN
    ALTER TABLE public.opportunities ADD COLUMN gate_champion_eb_aligned_notes TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'gate_competition_neutralized_notes') THEN
    ALTER TABLE public.opportunities ADD COLUMN gate_competition_neutralized_notes TEXT;
  END IF;

  -- Closed Won gate notes
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'gate_contract_signed_notes') THEN
    ALTER TABLE public.opportunities ADD COLUMN gate_contract_signed_notes TEXT;
  END IF;
END $$;

COMMENT ON COLUMN public.opportunities.demand_4u_unworkable_notes IS 'Structured answer for 4U Unworkable gate';
COMMENT ON COLUMN public.opportunities.demand_4u_urgent_notes IS 'Structured answer for 4U Urgent gate';
COMMENT ON COLUMN public.opportunities.demand_4u_unavoidable_notes IS 'Structured answer for 4U Unavoidable gate';
COMMENT ON COLUMN public.opportunities.demand_4u_underserved_notes IS 'Structured answer for 4U Underserved gate';
