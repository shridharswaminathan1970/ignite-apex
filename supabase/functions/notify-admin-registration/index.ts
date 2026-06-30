// Edge Function: Notify Super Admin of New Registration Request
// Sends email to super admin when new user requests account

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPER_DUPER_ADMIN_EMAIL = 'muhammad.shaamel@gmail.com' // Super Duper Admin

serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    const { requestId, fullName, email, phone, country, company } = await req.json()

    console.log('[Notify Admin] New registration request:', { fullName, email })

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Send email to super admin (you'll need to configure this)
    // For now, we'll just log it and return success
    // TODO: Integrate with SendGrid/Resend/etc to send actual email

    const emailContent = `
      New IGNITE-APEX Registration Request

      Name: ${fullName}
      Email: ${email}
      Phone: ${phone}
      Country: ${country}
      Company: ${company}

      To approve this request:
      1. Go to: https://shaamelz.com/app/admin.html
      2. Find the pending request
      3. Click "Approve" to send password-set link to user

      Request ID: ${requestId}
    `

    console.log('[Notify Admin] Email content:', emailContent)

    // TODO: Send actual email here
    // await sendEmail({
    //   to: SUPER_DUPER_ADMIN_EMAIL,
    //   subject: `New Individual Registration Request: ${fullName}`,
    //   body: emailContent
    // })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Registration request submitted successfully'
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('[Notify Admin] Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
