/**
 * User Menu Component
 *
 * Reusable user menu with profile, reset password, and logout
 * Include in any authenticated page
 */

(function() {
  'use strict';

  // Add CSS for user menu
  const style = document.createElement('style');
  style.textContent = `
    .ia-user-menu {
      position: relative;
    }
    .ia-user-btn {
      background: var(--s2, #141720);
      border: 1px solid var(--b1, #1E2333);
      border-radius: 8px;
      padding: .5rem 1rem;
      color: var(--t1, #EEF0F8);
      font-size: .75rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: .5rem;
      font-weight: 600;
      transition: all .2s;
      font-family: inherit;
    }
    .ia-user-btn:hover {
      background: var(--b1, #1E2333);
      border-color: var(--amber, #F59E0B);
    }
    .ia-user-dropdown {
      display: none;
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      background: var(--s1, #0F1117);
      border: 1px solid var(--b1, #1E2333);
      border-radius: 8px;
      min-width: 220px;
      box-shadow: 0 8px 24px rgba(0,0,0,.5);
      z-index: 1000;
    }
    .ia-user-dropdown.active {
      display: block;
    }
    .ia-user-info {
      padding: 1rem;
      border-bottom: 1px solid var(--b1, #1E2333);
    }
    .ia-user-name {
      font-weight: 700;
      font-size: .85rem;
      color: var(--t1, #EEF0F8);
    }
    .ia-user-email {
      font-size: .7rem;
      color: var(--t3, #4A5268);
      margin-top: .25rem;
    }
    .ia-user-role {
      font-size: .65rem;
      color: var(--amber, #F59E0B);
      text-transform: uppercase;
      letter-spacing: .5px;
      margin-top: .35rem;
      font-weight: 600;
    }
    .ia-dropdown-item {
      padding: .75rem 1rem;
      font-size: .8rem;
      color: var(--t2, #8892AA);
      cursor: pointer;
      transition: all .2s;
      display: flex;
      align-items: center;
      gap: .5rem;
    }
    .ia-dropdown-item:hover {
      background: var(--s2, #141720);
      color: var(--t1, #EEF0F8);
    }
    .ia-dropdown-divider {
      height: 1px;
      background: var(--b1, #1E2333);
      margin: .25rem 0;
    }
    .ia-dropdown-item.danger {
      color: var(--red, #EF4444);
    }
  `;
  document.head.appendChild(style);

  // User menu HTML
  const userMenuHTML = `
    <div class="ia-user-menu">
      <button class="ia-user-btn" id="ia-user-menu-btn">
        <span id="ia-user-name-display">Loading...</span>
        <span>▼</span>
      </button>
      <div class="ia-user-dropdown" id="ia-user-dropdown">
        <div class="ia-user-info">
          <div class="ia-user-name" id="ia-user-name-full">Loading...</div>
          <div class="ia-user-email" id="ia-user-email">loading@example.com</div>
          <div class="ia-user-role" id="ia-user-role">User</div>
        </div>
        <div class="ia-dropdown-item" onclick="window.IAUserMenu.goToLauncher()">
          🏠 App Launcher
        </div>
        <div class="ia-dropdown-item" onclick="window.IAUserMenu.viewProfile()">
          👤 My Profile
        </div>
        <div class="ia-dropdown-item" onclick="window.IAUserMenu.viewReports()">
          📊 Reports
        </div>
        <div class="ia-dropdown-item" onclick="window.IAUserMenu.resetPassword()">
          🔑 Reset Password
        </div>
        <div class="ia-dropdown-divider"></div>
        <div class="ia-dropdown-item danger" onclick="window.IAUserMenu.logout()">
          🚪 Sign Out
        </div>
      </div>
    </div>
  `;

  // User menu API
  window.IAUserMenu = {
    currentUser: null,

    // Initialize user menu
    init() {
      // Wait for user to be loaded
      document.addEventListener('ia:ready', (event) => {
        if (event.detail.online && event.detail.user) {
          this.currentUser = event.detail.user;
          this.updateUI();
        }
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.ia-user-menu')) {
          const dropdown = document.getElementById('ia-user-dropdown');
          if (dropdown) dropdown.classList.remove('active');
        }
      });

      // Toggle dropdown on button click
      document.addEventListener('click', (e) => {
        if (e.target.closest('#ia-user-menu-btn')) {
          const dropdown = document.getElementById('ia-user-dropdown');
          if (dropdown) dropdown.classList.toggle('active');
        }
      });
    },

    // Render user menu into container
    render(containerId) {
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = userMenuHTML;
      }
    },

    // Update UI with user info
    updateUI() {
      if (!this.currentUser) return;

      const firstName = this.currentUser.name
        ? this.currentUser.name.split(' ')[0]
        : this.currentUser.email.split('@')[0];

      const displayEl = document.getElementById('ia-user-name-display');
      const fullNameEl = document.getElementById('ia-user-name-full');
      const emailEl = document.getElementById('ia-user-email');
      const roleEl = document.getElementById('ia-user-role');

      if (displayEl) displayEl.textContent = firstName;
      if (fullNameEl) fullNameEl.textContent = this.currentUser.name || this.currentUser.email;
      if (emailEl) emailEl.textContent = this.currentUser.email;
      if (roleEl) roleEl.textContent = this.currentUser.role || 'User';
    },

    // Go to app launcher
    goToLauncher() {
      window.location.href = '/app/launcher.html';
    },

    // View profile
    viewProfile() {
      // Check if we're in CRM or main app
      const currentPath = window.location.pathname;
      if (currentPath.includes('/crm/')) {
        window.location.href = '/crm/profile.html';
      } else {
        window.location.href = '/app/profile.html';
      }
    },

    // View reports
    viewReports() {
      // Check if we're in CRM or main app
      const currentPath = window.location.pathname;
      if (currentPath.includes('/crm/')) {
        window.location.href = '/crm/reports.html';
      } else {
        window.location.href = '/app/reports.html';
      }
    },

    // Reset password
    async resetPassword() {
      if (!this.currentUser) return;

      const confirmed = confirm('Send password reset email to ' + this.currentUser.email + '?');
      if (!confirmed) return;

      try {
        const sb = window.supabaseClient || window.IAdb?.supabase;
        if (!sb) throw new Error('Supabase client not available');

        const { error } = await sb.auth.resetPasswordForEmail(
          this.currentUser.email,
          {
            redirectTo: `${window.location.origin}/app/reset-password.html`
          }
        );

        if (error) throw error;

        alert('✓ Password reset email sent! Check your inbox.');
      } catch (err) {
        console.error('Reset password error:', err);
        alert('Failed to send reset email. Please try again.');
      }
    },

    // Logout
    async logout() {
      const confirmed = confirm('Are you sure you want to sign out?');
      if (!confirmed) return;

      try {
        // Use the new supabaseClient
        const sb = window.supabaseClient || window.IAdb?.supabase;
        if (sb) {
          await sb.auth.signOut();
        }
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/app/auth.html';
      } catch (err) {
        console.error('Logout error:', err);
        // Force logout anyway
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/app/auth.html';
      }
    }
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.IAUserMenu.init());
  } else {
    window.IAUserMenu.init();
  }

})();
