// Email Templates for IGNITE-APEX

export const TEMPLATES = {
  // Registration approval - send password-set link
  registrationApproved: (name: string, email: string, resetLink: string) => ({
    subject: '✅ Your IGNITE-APEX Account is Ready!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #F59E0B 0%, #FCD34D 100%); padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; color: #000; font-size: 28px; font-weight: 800; letter-spacing: 2px; }
          .content { padding: 40px 30px; }
          .content h2 { color: #1E2333; font-size: 22px; margin-bottom: 20px; }
          .content p { color: #4A5268; line-height: 1.8; margin-bottom: 20px; font-size: 16px; }
          .cta-button { display: inline-block; background: #F59E0B; color: #000; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px; margin: 20px 0; }
          .cta-button:hover { background: #FCD34D; }
          .footer { background: #f9f9f9; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0; }
          .footer p { color: #8892AA; font-size: 13px; margin: 5px 0; }
          .features { background: #f9f9f9; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .features li { color: #4A5268; margin-bottom: 10px; list-style: none; }
          .features li::before { content: '✓'; color: #10B981; font-weight: 700; margin-right: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>IGNITE_APEX</h1>
          </div>
          <div class="content">
            <h2>Welcome, ${name}! 🎉</h2>
            <p>Your IGNITE-APEX account request has been approved by our team. You're all set to start using the platform!</p>

            <p><strong>Next Step:</strong> Set your password to complete your account setup.</p>

            <div style="text-align: center;">
              <a href="${resetLink}" class="cta-button">Set My Password →</a>
            </div>

            <div class="features">
              <p style="font-weight: 700; color: #1E2333; margin-bottom: 15px;">What's Included:</p>
              <ul style="padding-left: 0;">
                <li><strong>Sales OS:</strong> FREE forever - Full sales workflow management</li>
                <li><strong>CRM:</strong> 99-day trial available - Activate when ready</li>
                <li><strong>IGNITE-APEX Framework:</strong> Advanced qualification methodology</li>
              </ul>
            </div>

            <p style="font-size: 14px; color: #8892AA; margin-top: 30px;">
              This link expires in 24 hours. If you didn't request this account, please ignore this email.
            </p>
          </div>
          <div class="footer">
            <p><strong>IGNITE-APEX</strong></p>
            <p>Questions? Email: <a href="mailto:info@shaamelz.com" style="color: #F59E0B;">info@shaamelz.com</a></p>
            <p>&copy; 2026 IGNITE-APEX. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // Trial reminder - Day 120 (21 days after expiry)
  trialReminder120: (name: string, orgName: string) => ({
    subject: '⏰ Your IGNITE-APEX CRM Trial Expired - Reactivate Now',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #F59E0B 0%, #FCD34D 100%); padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; color: #000; font-size: 28px; font-weight: 800; }
          .content { padding: 40px 30px; }
          .warning-box { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 20px; margin: 20px 0; border-radius: 4px; }
          .cta-button { display: inline-block; background: #F59E0B; color: #000; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px; margin: 20px 0; }
          .footer { background: #f9f9f9; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Trial Expired</h1>
          </div>
          <div class="content">
            <h2>Hi ${name},</h2>
            <p>Your 99-day CRM trial for <strong>${orgName}</strong> expired 21 days ago.</p>

            <div class="warning-box">
              <p style="margin: 0; color: #92400E;"><strong>Important:</strong> Your CRM access has been disabled. Subscribe now to restore access and keep your data.</p>
            </div>

            <p>Don't lose your progress! Reactivate your CRM subscription today.</p>

            <div style="text-align: center;">
              <a href="https://shaamelz.com/pricing.html" class="cta-button">View Pricing & Subscribe →</a>
            </div>

            <p style="font-size: 14px; color: #8892AA; margin-top: 30px;">
              <strong>Reminder Schedule:</strong><br>
              📧 Day 130 - Second reminder<br>
              🚨 Day 140 - Final warning (account may be deactivated without further notice)
            </p>
          </div>
          <div class="footer">
            <p>Questions? Email: <a href="mailto:info@shaamelz.com" style="color: #F59E0B;">info@shaamelz.com</a></p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // Trial reminder - Day 130 (31 days after expiry)
  trialReminder130: (name: string, orgName: string) => ({
    subject: '⚠️ Action Required: IGNITE-APEX CRM Access Ending Soon',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #EF4444 0%, #F59E0B 100%); padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; color: #fff; font-size: 28px; font-weight: 800; }
          .content { padding: 40px 30px; }
          .warning-box { background: #FEE2E2; border-left: 4px solid #EF4444; padding: 20px; margin: 20px 0; border-radius: 4px; }
          .cta-button { display: inline-block; background: #F59E0B; color: #000; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px; margin: 20px 0; }
          .footer { background: #f9f9f9; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Urgent Action Required</h1>
          </div>
          <div class="content">
            <h2>Hi ${name},</h2>
            <p>Your CRM access for <strong>${orgName}</strong> has been expired for 31 days.</p>

            <div class="warning-box">
              <p style="margin: 0; color: #991B1B;"><strong>Warning:</strong> Subscribe within 10 days or your account may be deactivated without further notice.</p>
            </div>

            <p><strong>What happens if you don't subscribe:</strong></p>
            <ul style="color: #4A5268; line-height: 1.8;">
              <li>Your CRM data may be permanently deleted</li>
              <li>You'll lose access to all saved opportunities</li>
              <li>Team members will be removed from the platform</li>
            </ul>

            <div style="text-align: center;">
              <a href="https://shaamelz.com/pricing.html" class="cta-button">Subscribe Now to Keep Your Data →</a>
            </div>
          </div>
          <div class="footer">
            <p>Questions? Email: <a href="mailto:info@shaamelz.com" style="color: #F59E0B;">info@shaamelz.com</a></p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // Trial reminder - Day 140 (41 days after expiry - FINAL WARNING)
  trialReminder140: (name: string, orgName: string) => ({
    subject: '🚨 FINAL WARNING: IGNITE-APEX CRM Account Deactivation Imminent',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: 3px solid #EF4444; }
          .header { background: #EF4444; padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; color: #fff; font-size: 28px; font-weight: 800; }
          .content { padding: 40px 30px; }
          .critical-box { background: #7F1D1D; color: #fff; padding: 25px; margin: 20px 0; border-radius: 8px; text-align: center; }
          .cta-button { display: inline-block; background: #EF4444; color: #fff; padding: 18px 50px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 18px; margin: 20px 0; }
          .footer { background: #f9f9f9; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 FINAL WARNING</h1>
          </div>
          <div class="content">
            <h2 style="color: #EF4444;">Hi ${name},</h2>
            <p>This is your <strong>final warning</strong>. Your CRM account for <strong>${orgName}</strong> will be deactivated <strong>without further notice</strong>.</p>

            <div class="critical-box">
              <p style="font-size: 20px; font-weight: 700; margin: 0;">ACCOUNT DEACTIVATION IMMINENT</p>
              <p style="margin: 10px 0 0 0; font-size: 14px;">Subscribe now or lose all data permanently</p>
            </div>

            <p style="color: #EF4444; font-weight: 700; font-size: 16px;">This is the last email you will receive.</p>

            <p><strong>What you'll lose:</strong></p>
            <ul style="color: #4A5268; line-height: 1.8;">
              <li>All CRM data (permanently deleted)</li>
              <li>Saved opportunities and contacts</li>
              <li>Team access and permissions</li>
              <li>Historical analytics and reports</li>
            </ul>

            <div style="text-align: center; background: #FEE2E2; padding: 30px; border-radius: 8px; margin: 30px 0;">
              <p style="margin: 0 0 20px 0; font-size: 18px; font-weight: 700; color: #991B1B;">ACT NOW - LAST CHANCE</p>
              <a href="https://shaamelz.com/pricing.html" class="cta-button">SUBSCRIBE NOW →</a>
            </div>
          </div>
          <div class="footer">
            <p style="color: #EF4444; font-weight: 700;">This is your final notice.</p>
            <p>Questions? Email: <a href="mailto:info@shaamelz.com" style="color: #F59E0B;">info@shaamelz.com</a></p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // Admin notification - New registration request
  adminNotification: (userEmail: string, userName: string, company: string, phone: string, country: string) => ({
    subject: '🔔 New Registration Request - IGNITE-APEX',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
          .header { background: #3B82F6; padding: 30px; text-align: center; }
          .header h1 { margin: 0; color: #fff; font-size: 24px; }
          .content { padding: 30px; }
          .info-row { padding: 12px; border-bottom: 1px solid #e0e0e0; display: flex; }
          .info-label { font-weight: 700; color: #1E2333; min-width: 100px; }
          .info-value { color: #4A5268; }
          .cta-button { display: inline-block; background: #F59E0B; color: #000; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-weight: 700; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 New Registration Request</h1>
          </div>
          <div class="content">
            <p><strong>A new user has requested access to IGNITE-APEX.</strong></p>

            <div style="margin: 20px 0;">
              <div class="info-row">
                <div class="info-label">Name:</div>
                <div class="info-value">${userName}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Email:</div>
                <div class="info-value">${userEmail}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Phone:</div>
                <div class="info-value">${phone}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Country:</div>
                <div class="info-value">${country}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Company:</div>
                <div class="info-value">${company}</div>
              </div>
            </div>

            <div style="text-align: center;">
              <a href="https://shaamelz.com/app/admin.html" class="cta-button">Review & Approve →</a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  })
}
