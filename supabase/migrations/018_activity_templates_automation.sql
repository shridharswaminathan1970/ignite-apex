-- 018_activity_templates_automation.sql
-- Activity templates and automation triggers

-- Create activity_templates table
CREATE TABLE IF NOT EXISTS public.activity_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL, -- No FK constraint - org_id is just a grouping field
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'call', 'email', 'meeting', 'note'
  description TEXT,
  subject_template TEXT,
  description_template TEXT,
  duration_minutes INTEGER,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create task_templates table (auto-create tasks when stage changes)
CREATE TABLE IF NOT EXISTS public.task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL, -- No FK constraint - org_id is just a grouping field
  name TEXT NOT NULL,
  trigger_stage TEXT NOT NULL, -- 'Qualification', 'Discovery', 'Demo', etc.
  task_type TEXT NOT NULL, -- 'call', 'email', 'meeting', 'follow_up'
  subject_template TEXT NOT NULL,
  description_template TEXT,
  due_days_offset INTEGER DEFAULT 1, -- Days after stage change
  priority TEXT DEFAULT 'medium',
  reminder_minutes INTEGER DEFAULT 60,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create task_reminders table (for email reminders)
CREATE TABLE IF NOT EXISTS public.task_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  reminder_time TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.activity_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_reminders ENABLE ROW LEVEL SECURITY;

-- Activity templates policies
CREATE POLICY "Users can view org activity templates"
  ON public.activity_templates FOR SELECT
  USING (org_id = (SELECT app_org()));

CREATE POLICY "Admins can manage activity templates"
  ON public.activity_templates FOR ALL
  USING (
    org_id = (SELECT app_org()) AND
    (SELECT app_role()) IN ('super_duper_admin', 'super_admin', 'admin', 'admin_m')
  );

-- Task templates policies
CREATE POLICY "Users can view org task templates"
  ON public.task_templates FOR SELECT
  USING (org_id = (SELECT app_org()));

CREATE POLICY "Admins can manage task templates"
  ON public.task_templates FOR ALL
  USING (
    org_id = (SELECT app_org()) AND
    (SELECT app_role()) IN ('super_duper_admin', 'super_admin', 'admin', 'admin_m')
  );

-- Task reminders policies
CREATE POLICY "Users can view their task reminders"
  ON public.task_reminders FOR SELECT
  USING (
    task_id IN (
      SELECT id FROM public.tasks WHERE assigned_to = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_activity_templates_org ON public.activity_templates(org_id);
CREATE INDEX IF NOT EXISTS idx_task_templates_org_stage ON public.task_templates(org_id, trigger_stage);
CREATE INDEX IF NOT EXISTS idx_task_reminders_task ON public.task_reminders(task_id);
CREATE INDEX IF NOT EXISTS idx_task_reminders_pending ON public.task_reminders(reminder_time) WHERE status = 'pending';

-- Insert default activity templates (for each distinct org_id in users table)
INSERT INTO public.activity_templates (org_id, name, type, subject_template, description_template, duration_minutes, created_by)
SELECT DISTINCT ON (u.org_id, t.name)
  u.org_id,
  t.name,
  t.type,
  t.subject,
  t.description,
  t.duration,
  u.id
FROM public.users u
CROSS JOIN (
  VALUES
    ('Discovery Call', 'call', 'Discovery call with {{company_name}}', 'Understand pain points, timeline, budget, decision process', 30),
    ('Demo Meeting', 'meeting', 'Product demo for {{company_name}}', 'Walk through solution addressing their specific pain points', 60),
    ('Proposal Review', 'meeting', 'Proposal review with {{company_name}}', 'Present business case and ROI analysis', 45),
    ('Follow-up Email', 'email', 'Following up on {{subject}}', 'Check in on next steps and address any questions', NULL),
    ('Contract Discussion', 'call', 'Contract terms discussion - {{company_name}}', 'Review pricing, terms, and implementation timeline', 30)
) AS t(name, type, subject, description, duration)
WHERE u.role IN ('super_admin', 'admin', 'super_duper_admin') AND u.org_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Insert default task templates (auto-create tasks on stage change)
INSERT INTO public.task_templates (org_id, name, trigger_stage, task_type, subject_template, description_template, due_days_offset, priority, reminder_minutes)
SELECT DISTINCT ON (u.org_id, t.name)
  u.org_id,
  t.name,
  t.stage,
  t.type,
  t.subject,
  t.description,
  t.due_days,
  t.priority,
  t.reminder
FROM public.users u
CROSS JOIN (
  VALUES
    ('Schedule Discovery Call', 'Qualification', 'call', 'Schedule discovery call with {{company_name}}', 'Book initial call to understand pain points and timeline', 1, 'high', 60),
    ('Send Discovery Summary', 'Discovery', 'email', 'Send discovery call summary to {{company_name}}', 'Recap key points, pain points identified, and next steps', 1, 'high', 60),
    ('Prepare Demo', 'Demo', 'follow_up', 'Prepare tailored demo for {{company_name}}', 'Customize demo based on discovery findings and pain points', 2, 'high', 1440),
    ('Follow up on Demo', 'Demo', 'call', 'Demo follow-up call - {{company_name}}', 'Address questions and confirm fit', 1, 'medium', 60),
    ('Send Proposal', 'Proposal', 'email', 'Send proposal to {{company_name}}', 'Include business case, ROI analysis, and pricing', 2, 'high', 1440),
    ('Proposal Review Meeting', 'Proposal', 'meeting', 'Proposal review with {{company_name}}', 'Walk through proposal and address objections', 3, 'high', 1440),
    ('Send Contract', 'Negotiation', 'email', 'Send contract to {{company_name}}', 'Final contract with agreed terms and pricing', 1, 'high', 60),
    ('Schedule Kickoff', 'Closed Won', 'meeting', 'Implementation kickoff - {{company_name}}', 'Hand off to customer success team', 3, 'medium', 1440)
) AS t(name, stage, type, subject, description, due_days, priority, reminder)
WHERE u.role IN ('super_admin', 'admin', 'super_duper_admin') AND u.org_id IS NOT NULL
ON CONFLICT DO NOTHING;

COMMENT ON TABLE public.activity_templates IS 'Reusable activity templates for common sales actions';
COMMENT ON TABLE public.task_templates IS 'Auto-create tasks when opportunity moves to a stage';
COMMENT ON TABLE public.task_reminders IS 'Email reminders for upcoming tasks';
