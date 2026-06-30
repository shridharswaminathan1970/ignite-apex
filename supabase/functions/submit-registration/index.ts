// submit-registration Edge Function
// Handles new user registration requests (industry standard secure flow)
// NO passwords - only sends notification to admin for approval

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { fullName, email, company } = await req.json()

    if (!fullName || !email) {
      throw new Error('Full name and email are required')
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email address')
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Check if email already exists in users table
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('email', email)
      .single()

    if (existingUser) {
      throw new Error('This email is already registered. Please use the Sign In page.')
    }

    // Check if there's already a pending request for this email
    const { data: existingRequest } = await supabaseAdmin
      .from('registration_requests')
      .select('id, status')
      .eq('email', email)
      .eq('status', 'pending')
      .single()

    if (existingRequest) {
      throw new Error('A registration request with this email is already pending approval.')
    }

    // Create registration request
    const { data: request, error: insertError } = await supabaseAdmin
      .from('registration_requests')
      .insert({
        full_name: fullName,
        email: email,
        company: company || 'NA',
        status: 'pending'
      })
      .select()
      .single()

    if (insertError) throw insertError

    console.log('[submit-registration] Request created:', request.id)

    // Send email notification to Platform Master
    // TODO: Integrate with SendGrid/Resend for actual email
    // For now, return notification details
    const notificationEmail = {
      to: 'muhammad.shaamel@gmail.com',
      subject: 'New Registration Request - IGNITE-APEX',
      body: `
A new user has requested access to IGNITE-APEX:

Name: ${fullName}
Email: ${email}
Company: ${company || 'NA (Free Tier)'}
Requested: ${new Date().toLocaleString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})}

To approve and send invite:
1. Log into Master Console at https://shaamelz.com/app/master-console.html
2. Go to "Pending Registrations" tab
3. Click "Approve & Send Invite"

Security Note: No password has been set yet. User will set their own password when they receive the invite link.
      `
    }

    console.log('[submit-registration] Notification email:', notificationEmail)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Registration request submitted successfully',
        requestId: request.id,
        notification: notificationEmail
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[submit-registration] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
