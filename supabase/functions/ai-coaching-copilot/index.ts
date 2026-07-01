// supabase/functions/ai-coaching-copilot/index.ts
// AI Co-Pilot for Phase D
// Proactive, context-aware coaching with full deal analysis

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

interface CoPilotRequest {
  opportunityId: string
  fullContext: {
    deal: any
    activities: any[]
    gates: any
    health: any
  }
  sessionPatterns?: any
  targetGate?: string | null
}

interface CoPilotResponse {
  strengths: string[]
  weaknesses: string[]
  nextAction: string
  reframe?: string
  pattern?: string
  confidence: 'high' | 'medium' | 'low'
}

serve(async (req) => {
  // CORS
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
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const requestData: CoPilotRequest = await req.json()

    // Build context string for Claude
    const contextString = buildContextString(requestData)

    // Call Claude
    const coaching = await getCoPilotCoaching(contextString, requestData.sessionPatterns)

    return new Response(JSON.stringify(coaching), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })

  } catch (error) {
    console.error('AI Co-Pilot error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
})

function buildContextString(req: CoPilotRequest): string {
  const { deal, activities, gates, health } = req.fullContext

  let context = `DEAL OVERVIEW:
Name: ${deal.name}
Account: ${deal.account_name || 'Unknown'}
Stage: ${deal.stage_id || 'raw_lead'}
Value: $${deal.amount || 0}
Close Date: ${deal.close_date || 'Not set'}
Probability: ${deal.probability || 0}%
Deal Health: ${health.score}/100 (${health.status.toUpperCase()})

`

  // 4U Gates
  context += `4U VALIDATION (IGNITE Gate):\n`
  const fourU = [
    { field: 'demand_4u_unworkable', label: 'Unworkable' },
    { field: 'demand_4u_urgent', label: 'Urgent' },
    { field: 'demand_4u_unavoidable', label: 'Unavoidable' },
    { field: 'demand_4u_underserved', label: 'Underserved' }
  ]
  fourU.forEach(g => {
    const gate = gates[g.field]
    context += `- ${g.label}: ${gate?.met ? '✅' : '❌'} | Strength: ${gate?.strength || 0}/5 | Notes: ${gate?.notes || '(empty)'}\n`
  })

  // Key gates
  context += `\nKEY GATES:\n`
  const keyGates = [
    { field: 'gate_economic_buyer_identified', label: 'Economic Buyer' },
    { field: 'gate_metrics_quantified', label: 'Metrics Quantified' },
    { field: 'gate_champion_emerging', label: 'Champion' },
    { field: 'gate_pain_tied_to_outcome', label: 'Pain → Outcome' }
  ]
  keyGates.forEach(g => {
    const gate = gates[g.field]
    context += `- ${g.label}: ${gate?.met ? '✅' : '❌'} | Strength: ${gate?.strength || 0}/5 | Notes: ${gate?.notes || '(empty)'}\n`
  })

  // Activities
  context += `\nRECENT ACTIVITIES (last 5):\n`
  if (activities && activities.length > 0) {
    activities.forEach(a => {
      const date = new Date(a.created_at).toLocaleDateString()
      context += `- ${a.activity_type}: ${a.description} (${date})\n`
    })
  } else {
    context += '(No activities logged)\n'
  }

  // Health reasons
  if (health.reasons && health.reasons.length > 0) {
    context += `\nHEALTH FLAGS:\n`
    health.reasons.forEach(r => {
      context += `- ${r}\n`
    })
  }

  return context
}

async function getCoPilotCoaching(context: string, sessionPatterns: any): Promise<CoPilotResponse> {
  const systemPrompt = `You are an expert B2B sales AI co-pilot for the IGNITE-APEX qualification methodology.

Your role:
- Analyze deals proactively (rep didn't ask, you're always-on)
- Be brutally honest about weak evidence
- Suggest ONE specific next action
- If deal looks stuck, suggest a reframe

CRITICAL RULES:
1. Never say "looks good" — always find the gap
2. Be specific — no generic advice like "follow up"
3. Strengths = what's actually strong with evidence
4. Weaknesses = what's missing, vague, or unquantified
5. Next action = ONE specific question or move that advances the deal

Your tone: Direct coach who wants them to win, not a cheerleader.`

  const userPrompt = `Analyze this deal and provide proactive coaching:

${context}

${sessionPatterns && sessionPatterns.deals && sessionPatterns.deals.length > 1 ? `
SESSION PATTERNS:
You've seen ${sessionPatterns.deals.length} deals this session. Look for common blockers or success patterns.
` : ''}

Provide:
1. STRENGTHS: 2-3 specific things that are strong (with evidence)
2. WEAKNESSES: 2-4 gaps, missing info, or weak evidence
3. NEXT ACTION: ONE specific move (e.g., "Ask CFO: 'Walk me through who signs off on a $50K purchase'")
4. REFRAME (optional): If deal looks stuck, suggest a different angle
5. PATTERN (optional): If you see a pattern from session data, note it
6. CONFIDENCE: high/medium/low

Format as JSON:
{
  "strengths": ["...", "..."],
  "weaknesses": ["...", "..."],
  "nextAction": "...",
  "reframe": "..." (optional),
  "pattern": "..." (optional),
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
      max_tokens: 1000,
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

  // Parse JSON
  try {
    const parsed = JSON.parse(text)
    return {
      strengths: parsed.strengths || [],
      weaknesses: parsed.weaknesses || [],
      nextAction: parsed.nextAction || 'Continue gathering evidence',
      reframe: parsed.reframe || null,
      pattern: parsed.pattern || null,
      confidence: parsed.confidence || 'medium'
    }
  } catch (e) {
    // Fallback
    return {
      strengths: [],
      weaknesses: ['Could not parse AI response'],
      nextAction: 'Review deal manually',
      confidence: 'low'
    }
  }
}
