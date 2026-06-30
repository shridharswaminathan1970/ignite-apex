// Trial Countdown Banner
// Include this in launcher.html and CRM pages to show trial status

async function showTrialBanner(supabaseClient, userId) {
  try {
    const { data: user } = await supabaseClient
      .from('users')
      .select('crm_trial_activated_at, crm_enabled, b2b0_trial_activated_at, b2b0_enabled, account_type')
      .eq('id', userId)
      .single();

    if (!user || user.account_type !== 'company') return; // Only show for company users

    let bannerHtml = '';

    // CRM Trial Banner
    if (user.crm_trial_activated_at) {
      const trialStart = new Date(user.crm_trial_activated_at);
      const now = new Date();
      const daysPassed = Math.floor((now - trialStart) / (1000 * 60 * 60 * 24));
      const daysRemaining = 99 - daysPassed;

      if (daysRemaining > 0 && user.crm_enabled) {
        let bannerColor = '#10B981'; // green
        let message = `🎉 CRM Trial: ${daysRemaining} days remaining`;

        if (daysRemaining <= 9) {
          bannerColor = '#EF4444'; // red
          message = `⚠️ CRM Trial expires in ${daysRemaining} days! Upgrade now to keep access.`;
        } else if (daysRemaining <= 30) {
          bannerColor = '#F59E0B'; // amber
          message = `⏰ CRM Trial: ${daysRemaining} days left. Consider upgrading soon.`;
        }

        bannerHtml += `
          <div style="background:${bannerColor};color:#fff;padding:1rem 2rem;text-align:center;font-weight:600;font-size:.9rem;border-bottom:2px solid rgba(0,0,0,0.1)">
            ${message}
            <a href="/app/pricing.html" style="color:#fff;text-decoration:underline;margin-left:1rem">View Plans →</a>
          </div>
        `;
      } else if (!user.crm_enabled) {
        bannerHtml += `
          <div style="background:#EF4444;color:#fff;padding:1rem 2rem;text-align:center;font-weight:600;font-size:.9rem;border-bottom:2px solid rgba(0,0,0,0.1)">
            🔒 CRM Trial Expired - Upgrade to restore access
            <a href="/app/pricing.html" style="color:#fff;text-decoration:underline;margin-left:1rem">Upgrade Now →</a>
          </div>
        `;
      }
    }

    // B2B0 Trial Banner
    if (user.b2b0_trial_activated_at) {
      const trialStart = new Date(user.b2b0_trial_activated_at);
      const now = new Date();
      const daysPassed = Math.floor((now - trialStart) / (1000 * 60 * 60 * 24));
      const daysRemaining = 7 - daysPassed;

      if (daysRemaining > 0 && user.b2b0_enabled) {
        const bannerColor = daysRemaining <= 2 ? '#EF4444' : '#F59E0B';
        const message = daysRemaining <= 2
          ? `⚠️ B2B0 Trial expires in ${daysRemaining} days!`
          : `⏰ B2B0 Outreach Trial: ${daysRemaining} days left`;

        bannerHtml += `
          <div style="background:${bannerColor};color:#fff;padding:1rem 2rem;text-align:center;font-weight:600;font-size:.9rem;border-bottom:2px solid rgba(0,0,0,0.1)">
            ${message}
            <a href="/app/pricing.html" style="color:#fff;text-decoration:underline;margin-left:1rem">Upgrade →</a>
          </div>
        `;
      } else if (!user.b2b0_enabled && user.b2b0_trial_activated_at) {
        bannerHtml += `
          <div style="background:#EF4444;color:#fff;padding:1rem 2rem;text-align:center;font-weight:600;font-size:.9rem;border-bottom:2px solid rgba(0,0,0,0.1)">
            🔒 B2B0 Trial Expired - Upgrade to restore access
            <a href="/app/pricing.html" style="color:#fff;text-decoration:underline;margin-left:1rem">Upgrade Now →</a>
          </div>
        `;
      }
    }

    if (bannerHtml) {
      document.body.insertAdjacentHTML('afterbegin', bannerHtml);
    }
  } catch (err) {
    console.error('[Trial Banner] Error:', err);
  }
}

// Auto-initialize if supabaseClient exists
if (typeof window !== 'undefined') {
  window.showTrialBanner = showTrialBanner;
}
