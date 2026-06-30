/**
 * Trial Banner & CRM Access Gate
 * Shows trial status, reminders, and blocks access after 150 days
 */

(function() {
  'use strict';

  // Add CSS for trial banner
  const style = document.createElement('style');
  style.textContent = `
    .trial-banner {
      position: sticky;
      top: 57px;
      z-index: 99;
      background: linear-gradient(135deg, #FEF3C7, #FCD34D);
      color: #78350F;
      padding: 1rem 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      border-bottom: 2px solid #F59E0B;
      animation: slideDown 0.3s ease;
    }

    .trial-banner.warning {
      background: linear-gradient(135deg, #FEE2E2, #FCA5A5);
      color: #7F1D1D;
      border-bottom-color: #DC2626;
    }

    .trial-banner.grace {
      background: linear-gradient(135deg, #FEE2D5, #FED7AA);
      color: #7C2D12;
      border-bottom-color: #C2410C;
    }

    .trial-banner-content {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .trial-banner-icon {
      font-size: 1.5rem;
    }

    .trial-banner-text {
      flex: 1;
    }

    .trial-banner-title {
      font-size: 0.9rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
    }

    .trial-banner-message {
      font-size: 0.8rem;
      opacity: 0.9;
    }

    .trial-banner-cta {
      background: #000;
      color: #FCD34D;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .trial-banner-cta:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }

    .trial-banner-dismiss {
      background: transparent;
      border: none;
      color: inherit;
      font-size: 1.2rem;
      cursor: pointer;
      opacity: 0.6;
      transition: opacity 0.2s;
      padding: 0.5rem;
    }

    .trial-banner-dismiss:hover {
      opacity: 1;
    }

    @keyframes slideDown {
      from {
        transform: translateY(-100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    /* Expired Modal */
    .trial-expired-modal {
      position: fixed;
      inset: 0;
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.95);
      backdrop-filter: blur(8px);
      animation: fadeIn 0.3s ease;
    }

    .trial-expired-content {
      background: #0F1117;
      border: 3px solid #EF4444;
      border-radius: 16px;
      padding: 3rem;
      max-width: 500px;
      text-align: center;
      animation: scaleIn 0.3s ease;
    }

    .trial-expired-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .trial-expired-title {
      font-size: 2rem;
      font-weight: 800;
      color: #EF4444;
      margin-bottom: 1rem;
      font-family: 'Syne', sans-serif;
    }

    .trial-expired-message {
      font-size: 1rem;
      color: #8892AA;
      line-height: 1.6;
      margin-bottom: 2rem;
    }

    .trial-expired-buttons {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    .trial-expired-btn {
      background: #F59E0B;
      color: #000;
      border: none;
      padding: 1rem 2rem;
      border-radius: 10px;
      font-size: 0.9rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
      text-decoration: none;
      display: inline-block;
    }

    .trial-expired-btn:hover {
      background: #FCD34D;
      transform: translateY(-2px);
    }

    .trial-expired-btn.secondary {
      background: #1E2333;
      color: #EEF0F8;
      border: 1px solid #272E42;
    }

    .trial-expired-btn.secondary:hover {
      background: #272E42;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes scaleIn {
      from {
        transform: scale(0.9);
        opacity: 0;
      }
      to {
        transform: scale(1);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);

  // Trial Banner API
  window.TrialBanner = {
    currentAccess: null,
    loginCount: 0,

    // Check CRM access and show appropriate UI
    async checkAccess() {
      try {
        const sb = window.supabaseClient;
        if (!sb) {
          console.warn('[TrialBanner] Supabase client not ready');
          return { allowed: true }; // Fail open during init
        }

        const { data: { session } } = await sb.auth.getSession();
        if (!session) {
          // Not logged in - redirect to auth
          window.location.href = '../app/auth.html';
          return { allowed: false };
        }

        // Check access via database function
        const { data: access, error } = await sb.rpc('can_access_crm', {
          user_id: session.user.id
        });

        if (error) {
          console.error('[TrialBanner] Access check error:', error);
          return { allowed: true }; // Fail open on error
        }

        this.currentAccess = access;

        // Track login
        await sb.rpc('track_crm_login', { user_id: session.user.id });

        // Handle access status
        if (!access.allowed) {
          if (access.status === 'trial_expired_blocked') {
            this.showExpiredModal(access);
            return { allowed: false };
          } else if (access.status === 'user_limit_reached') {
            this.showUserLimitModal(access);
            return { allowed: false };
          }
        }

        // Show trial banner if needed
        if (access.allowed && access.show_reminder) {
          // Check if we should show reminder (every 5th login)
          const loginCount = await this.getLoginCount(sb, session.user.id);
          if (loginCount % 5 === 0) {
            this.showTrialBanner(access);
          }
        } else if (access.allowed && access.status === 'trial' && access.days_remaining <= 30) {
          this.showTrialBanner(access);
        }

        return access;

      } catch (err) {
        console.error('[TrialBanner] Check access error:', err);
        return { allowed: true }; // Fail open
      }
    },

    async getLoginCount(sb, userId) {
      try {
        const { data } = await sb
          .from('users')
          .select('org_id')
          .eq('id', userId)
          .single();

        if (!data) return 0;

        const { data: sub } = await sb
          .from('org_subscriptions')
          .select('login_count_since_trial_end')
          .eq('org_id', data.org_id)
          .single();

        return sub?.login_count_since_trial_end || 0;
      } catch (err) {
        return 0;
      }
    },

    // Show trial status banner
    showTrialBanner(access) {
      // Don't show if already dismissed in this session
      if (sessionStorage.getItem('trial_banner_dismissed')) {
        return;
      }

      const container = document.createElement('div');
      let bannerClass = 'trial-banner';
      let icon = '⏰';
      let title = '';
      let message = '';

      if (access.status === 'trial') {
        const days = Math.floor(access.days_remaining);
        if (days <= 10) {
          bannerClass += ' warning';
          icon = '⚠️';
          title = `Trial ends in ${days} days!`;
          message = 'Subscribe now to keep your CRM access.';
        } else {
          icon = '🎉';
          title = `${days} days left in your free trial`;
          message = 'Enjoying IGNITE_APEX CRM? Subscribe to continue after trial.';
        }
      } else if (access.status === 'trial_expired_grace') {
        bannerClass += ' grace';
        icon = '⏰';
        title = 'Trial expired — Subscribe to continue';
        message = `Trial ended ${Math.floor(access.days_since_expiry)} days ago. CRM access will be locked after 150 days.`;
      }

      container.className = bannerClass;
      container.innerHTML = `
        <div class="trial-banner-content">
          <div class="trial-banner-icon">${icon}</div>
          <div class="trial-banner-text">
            <div class="trial-banner-title">${title}</div>
            <div class="trial-banner-message">${message}</div>
          </div>
        </div>
        <button class="trial-banner-cta" onclick="TrialBanner.goToPricing()">
          View Pricing
        </button>
        <button class="trial-banner-dismiss" onclick="TrialBanner.dismissBanner()">
          ✕
        </button>
      `;

      document.body.insertBefore(container, document.body.firstChild);
    },

    // Show expired modal (blocks access)
    showExpiredModal(access) {
      const modal = document.createElement('div');
      modal.className = 'trial-expired-modal';
      modal.innerHTML = `
        <div class="trial-expired-content">
          <div class="trial-expired-icon">🔒</div>
          <div class="trial-expired-title">Trial Expired</div>
          <div class="trial-expired-message">
            Your 150-day trial period has ended. Please subscribe to continue using the CRM.
            <br><br>
            Sales OS remains free and accessible at all times.
          </div>
          <div class="trial-expired-buttons">
            <a href="../pricing.html" class="trial-expired-btn">
              View Pricing
            </a>
            <button onclick="TrialBanner.contactAdmin()" class="trial-expired-btn secondary">
              Contact Administrator
            </button>
          </div>
        </div>
      `;

      document.body.innerHTML = '';
      document.body.appendChild(modal);
    },

    // Show user limit modal
    showUserLimitModal(access) {
      const modal = document.createElement('div');
      modal.className = 'trial-expired-modal';
      modal.innerHTML = `
        <div class="trial-expired-content">
          <div class="trial-expired-icon">👥</div>
          <div class="trial-expired-title">User Limit Reached</div>
          <div class="trial-expired-message">
            Your organization has reached the maximum of ${access.max_users} users for your current plan.
            <br><br>
            Please upgrade to add more users, or contact your administrator.
          </div>
          <div class="trial-expired-buttons">
            <a href="../pricing.html" class="trial-expired-btn">
              Upgrade Plan
            </a>
            <button onclick="TrialBanner.contactAdmin()" class="trial-expired-btn secondary">
              Contact Administrator
            </button>
          </div>
        </div>
      `;

      document.body.innerHTML = '';
      document.body.appendChild(modal);
    },

    dismissBanner() {
      const banner = document.querySelector('.trial-banner');
      if (banner) {
        banner.remove();
        sessionStorage.setItem('trial_banner_dismissed', 'true');
      }
    },

    goToPricing() {
      window.location.href = '../pricing.html';
    },

    contactAdmin() {
      const subject = encodeURIComponent('CRM Subscription Request');
      const body = encodeURIComponent(`Hi Administrator,

I would like to subscribe to IGNITE_APEX CRM.

My organization: [ORG NAME]
Preferred plan: [Team Mini / Midi / Maxi]
Billing cycle: [Monthly / Yearly]

OR

I would like to discuss subscription options. Can you arrange an eMeeting with me?

I am available on [DATE] from [TIME] to [TIME] AM/PM GMT.
I live in [COUNTRY] so you know my time zone.

Regards,
[YOUR NAME]`);

      window.location.href = `mailto:muhammad.shaamel@gmail.com,muhammad.shaamel@shaamelz.com?subject=${subject}&body=${body}`;
    }
  };

})();

console.log('[TrialBanner] Loaded');
