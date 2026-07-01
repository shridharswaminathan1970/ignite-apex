// supabase/functions/ai-coaching/index.ts
// AI Coaching for IGNITE-APEX qualification
// Provides: draft-to-confirm, weak evidence flags, next best action

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

interface CoachingRequest {
  // CRM mode (existing)
  opportunityId?: string
  stageId?: string
  gateField?: string

  // Sales OS mode
  context?: 'sales_os' | 'raw_lead'
  gateLabel?: string
  currentAnswer?: string
  prospectName?: string

  // Raw Lead mode
  dealName?: string
  ownerName?: string
  currentAnswers?: string
  promptInstruction?: string
}

interface CoachingResponse {
  draft: string
  weakEvidence: string[]
  nextAction: string
  confidence: 'high' | 'medium' | 'low'
}

serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  try {
    // Verify user is authenticated
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!)

    const requestData: CoachingRequest = await req.json()

    let context: string
    let gateIdentifier: string

    // Check context mode
    if (requestData.context === 'raw_lead') {
      // Raw Lead mode - coaching for pre-IGNITE qualification
      context = `Deal: ${requestData.dealName || 'Unknown'}
Owner: ${requestData.ownerName || 'Unknown'}
Stage: Raw Lead (0%)

Current Pre-Check Answers:
${requestData.currentAnswers || '(none yet)'}

${requestData.promptInstruction || 'Provide coaching for this Raw Lead.'}
`
      gateIdentifier = 'raw_lead'

    } else if (requestData.context === 'sales_os') {
      // Sales OS mode - simpler, no database lookup
      context = `Prospect: ${requestData.prospectName || 'Unknown'}
Gate: ${requestData.gateLabel}
Current Answer: ${requestData.currentAnswer || '(empty)'}

This is from the standalone IGNITE Sales OS. The rep is qualifying a prospect using the 4U framework.
`
      gateIdentifier = requestData.gateLabel || 'unknown'

    } else {
      // CRM mode - fetch opportunity from database
      const { opportunityId, stageId, gateField } = requestData

      if (!opportunityId) {
        throw new Error('opportunityId required for CRM mode')
      }

      const { data: opp, error: oppError } = await supabase
        .from('opportunities')
        .select('*')
        .eq('id', opportunityId)
        .single()

      if (oppError || !opp) {
        throw new Error('Opportunity not found')
      }

      // Fetch recent activities
      const { data: activities } = await supabase
        .from('activities')
        .select('*')
        .eq('opportunity_id', opportunityId)
        .order('created_at', { ascending: false })
        .limit(20)

      // Build context for Claude
      context = buildContext(opp, activities, stageId!, gateField!)
      gateIdentifier = gateField!
    }

    // Call Anthropic API
    const coaching = await getCoaching(context, gateIdentifier)

    return new Response(JSON.stringify(coaching), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })

  } catch (error) {
    console.error('AI Coaching error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
})

function buildContext(opp: any, activities: any[], stageId: string, gateField: string): string {
  let context = `Opportunity: ${opp.name}
Account: ${opp.account_name || 'Unknown'}
Stage: ${stageId}
Current Value: $${opp.amount || 0}
Close Date: ${opp.close_date || 'Not set'}

Gate Being Evaluated: ${gateField}
Current Answer: ${opp[gateField + '_notes'] || 'No answer yet'}
Gate Met: ${opp[gateField] ? 'Yes' : 'No'}

Recent Activities (last 20):
${activities?.map(a => `- ${a.activity_type}: ${a.description} (${new Date(a.created_at).toLocaleDateString()})`).join('\n') || 'No activities logged'}

4U Validation:
- Unworkable: ${opp.demand_4u_unworkable_notes || 'Not captured'}
- Urgent: ${opp.demand_4u_urgent_notes || 'Not captured'}
- Unavoidable: ${opp.demand_4u_unavoidable_notes || 'Not captured'}
- Underserved: ${opp.demand_4u_underserved_notes || 'Not captured'}

Key Gate Answers:
- Economic Buyer: ${opp.gate_economic_buyer_identified_notes || 'Not identified'}
- Metrics Quantified: ${opp.gate_metrics_quantified_notes || 'Not quantified'}
- Champion: ${opp.gate_champion_emerging_notes || 'No champion yet'}
- Pain → Outcome: ${opp.gate_pain_tied_to_outcome_notes || 'Not tied'}
`

  return context
}

async function getCoaching(context: string, gateField: string): Promise<CoachingResponse> {
  const systemPrompt = `You are an expert B2B sales coach using the IGNITE-APEX qualification methodology. Your job is to help reps honestly qualify deals, not fake gates.

CRITICAL RULES:
1. Never auto-complete a gate - only DRAFT a proposed answer the rep must confirm/edit
2. Call out weak evidence - be brutally honest when the gate isn't really met
3. Suggest ONE next action that moves the deal forward
4. Respond with ONLY a valid JSON object. No markdown, no code fences, no text before or after the JSON.

Your tone: Direct, helpful, no fluff. Think "tough coach who wants them to win."`

  const userPrompt = `Based on this deal context, provide coaching for the gate: ${gateField}

${context}

Provide:
1. DRAFT ANSWER: Based on logged activities/notes, draft a proposed answer for this gate. If there's insufficient evidence, say "Insufficient evidence - need to [specific action]"
2. WEAK EVIDENCE FLAGS: List any red flags that suggest this gate isn't really met (e.g., "No dollar figure", "Champion hasn't introduced you to anyone", "No direct quote from Economic Buyer")
3. NEXT BEST ACTION: ONE specific move to advance this deal (e.g., "Ask your champion: who signs off on a purchase this size?")
4. CONFIDENCE: Rate your confidence in the current gate answer as high/medium/low

IMPORTANT: Respond with ONLY the JSON object below. No markdown code fences, no explanatory text before or after.

{
  "draft": "...",
  "weakEvidence": ["...", "..."],
  "nextAction": "...",
  "confidence": "high|medium|low"
}`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt }
      ]
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Anthropic API error: ${response.status} ${error}`)
  }

  const data = await response.json()
  const text = data.content[0].text

  // Parse JSON response
  try {
    const parsed = JSON.parse(text)
    return {
      draft: parsed.draft || '',
      weakEvidence: parsed.weakEvidence || [],
      nextAction: parsed.nextAction || '',
      confidence: parsed.confidence || 'low'
    }
  } catch (e) {
    // Fallback if JSON parsing fails
    return {
      draft: text,
      weakEvidence: ['Could not parse AI response'],
      nextAction: 'Review the response manually',
      confidence: 'low'
    }
  }
}
