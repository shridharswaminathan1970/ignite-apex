// Supabase Edge Function to send user credentials via email
// Deploy with: supabase functions deploy send-credentials-email

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''

interface RequestBody {
  email: string
  passwordKey: string
  name: string
}

serve(async (req) => {
  try {
    const { email, passwordKey, name }: RequestBody = await req.json()

    // Validate inputs
    if (!email || !passwordKey || !name) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Send email via Resend API (or any email service)
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'IGNITE_APEX CRM <noreply@shaamelz.com>',
        to: email,
        subject: 'Your IGNITE_APEX CRM Login Credentials',
        html: generateCredentialsEmail(email, passwordKey, name)
      })
    })

    if (!emailResponse.ok) {
      const error = await emailResponse.text()
      console.error('Email send failed:', error)
      throw new Error('Failed to send email')
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Credentials email sent' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

function generateCredentialsEmail(email: string, passwordKey: string, name: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #F59E0B, #D97706); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; letter-spacing: 2px; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; }
    .credentials { background: white; border: 2px solid #F59E0B; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .credentials h2 { margin-top: 0; color: #F59E0B; font-size: 18px; }
    .cred-item { margin: 15px 0; }
    .cred-label { font-size: 12px; text-transform: uppercase; color: #6b7280; font-weight: 600; letter-spacing: 1px; }
    .cred-value { font-size: 18px; font-weight: 700; color: #111827; font-family: 'Courier New', monospace; background: #fef3c7; padding: 8px 12px; border-radius: 4px; display: inline-block; margin-top: 5px; }
    .button { display: inline-block; background: #F59E0B; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
    .warning { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>IGNITE_APEX CRM</h1>
    <p style="margin: 5px 0 0 0; font-size: 14px; letter-spacing: 1px;">Sales Operating System</p>
  </div>

  <div class="content">
    <p>Hello <strong>${name}</strong>,</p>

    <p>Welcome to IGNITE_APEX CRM! Your account has been successfully created. Below are your login credentials:</p>

    <div class="credentials">
      <h2>🔐 Your Login Credentials</h2>

      <div class="cred-item">
        <div class="cred-label">User ID</div>
        <div class="cred-value">${email}</div>
      </div>

      <div class="cred-item">
        <div class="cred-label">Password Key</div>
        <div class="cred-value">${passwordKey}</div>
      </div>
    </div>

    <div class="warning">
      <strong>⚠️ Important:</strong> Please save these credentials in a secure location. You will need both your User ID and Password Key to access the CRM.
    </div>

    <p>You can now sign in to your CRM account:</p>

    <center>
      <a href="https://shaamelz.com/app/auth.html" class="button">Sign In to CRM →</a>
    </center>

    <p><strong>What's included (90 days free):</strong></p>
    <ul>
      <li>Complete lead & opportunity management</li>
      <li>IGNITE_APEX methodology built-in</li>
      <li>Task tracking with reminders</li>
      <li>Team collaboration & role-based access</li>
      <li>Activity auto-logging</li>
      <li>Dashboard with pipeline metrics</li>
    </ul>

    <p>If you didn't create this account or have any questions, please contact our support team.</p>
  </div>

  <div class="footer">
    <p><strong>IGNITE_APEX CRM</strong><br>
    Sales Operating System for Demand Generation<br>
    <a href="https://shaamelz.com" style="color: #F59E0B;">shaamelz.com</a></p>
  </div>
</body>
</html>
  `
}
