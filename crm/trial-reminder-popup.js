// Trial Reminder Popup - Day 90 Warning
// Shows in-app popup when trial has 9 days remaining

async function checkTrialReminder() {
  try {
    const sb = window.supabaseClient;
    if (!sb) return;

    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;

    // Get user profile
    const { data: profile } = await sb
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.org_id) return;

    // Get subscription
    const { data: subscription } = await sb
      .from('org_subscriptions')
      .select('*')
      .eq('org_id', profile.org_id)
      .single();

    if (!subscription) return;

    // Check if on trial
    if (subscription.status !== 'trial' || !subscription.crm_enabled) return;

    const trialEndsAt = new Date(subscription.trial_ends_at);
    const today = new Date();
    const daysRemaining = Math.ceil((trialEndsAt - today) / (1000 * 60 * 60 * 24));

    // Show popup if 9 days or less remaining AND not already shown today
    if (daysRemaining <= 9 && daysRemaining > 0) {
      const remindersSent = subscription.trial_reminders_sent || {};
      const lastShown = remindersSent.day90 ? new Date(remindersSent.day90) : null;

      // Only show once (when it hits day 90 range)
      if (!lastShown) {
        showDay90Popup(daysRemaining);

        // Mark as shown
        remindersSent.day90 = today.toISOString();
        await sb
          .from('org_subscriptions')
          .update({ trial_reminders_sent: remindersSent })
          .eq('id', subscription.id);
      }
    }

  } catch (err) {
    console.error('[Trial Reminder] Error:', err);
  }
}

function showDay90Popup(daysRemaining) {
  const popup = document.createElement('div');
  popup.id = 'trial-reminder-popup';
  popup.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.8);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(8px);
    ">
      <div style="
        background: linear-gradient(135deg, #1E2333 0%, #0F1117 100%);
        border: 2px solid #F59E0B;
        border-radius: 20px;
        padding: 3rem;
        max-width: 500px;
        box-shadow: 0 20px 60px rgba(245, 158, 11, 0.3);
        text-align: center;
      ">
        <div style="font-size: 4rem; margin-bottom: 1rem;">⏰</div>
        <h2 style="
          font-family: 'Syne', sans-serif;
          font-size: 2rem;
          color: #F59E0B;
          margin-bottom: 1rem;
          font-weight: 800;
        ">Trial Ending Soon!</h2>
        <p style="
          font-size: 1.5rem;
          color: #EEF0F8;
          margin-bottom: 1.5rem;
          font-weight: 700;
        ">${daysRemaining} Days Remaining</p>
        <p style="
          font-size: 1rem;
          color: #8892AA;
          line-height: 1.6;
          margin-bottom: 2rem;
        ">
          Your CRM trial expires in ${daysRemaining} days. Subscribe now to keep your data
          and continue using all CRM features.
        </p>

        <div style="
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid #EF4444;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 2rem;
        ">
          <p style="
            font-size: 0.9rem;
            color: #EEF0F8;
            margin: 0;
            line-height: 1.8;
          ">
            <strong style="color: #EF4444;">Important Reminder Schedule:</strong><br>
            📧 Day 120 (21 days after expiry) - First email reminder<br>
            📧 Day 130 (31 days after expiry) - Second email reminder<br>
            🚨 Day 140 (41 days after expiry) - Final warning<br>
            <span style="color: #EF4444; font-weight: 700;">Account may be deactivated without warning after Day 140</span>
          </p>
        </div>

        <div style="display: flex; gap: 1rem; justify-content: center;">
          <button onclick="window.location.href='/pricing.html'" style="
            background: #F59E0B;
            color: #000;
            border: none;
            padding: 1rem 2rem;
            border-radius: 10px;
            font-size: 1rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s;
          " onmouseover="this.style.background='#FCD34D'" onmouseout="this.style.background='#F59E0B'">
            💳 Subscribe Now
          </button>
          <button onclick="document.getElementById('trial-reminder-popup').remove()" style="
            background: transparent;
            color: #8892AA;
            border: 1px solid #4A5268;
            padding: 1rem 2rem;
            border-radius: 10px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          " onmouseover="this.style.borderColor='#8892AA'" onmouseout="this.style.borderColor='#4A5268'">
            Remind Me Later
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(popup);
}

// Auto-check on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', checkTrialReminder);
} else {
  checkTrialReminder();
}
