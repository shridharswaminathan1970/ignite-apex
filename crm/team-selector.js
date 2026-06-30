/**
 * team-selector.js
 * Hierarchical team/user selector for filtering reports, pipeline, forecasts
 * Respects org hierarchy: user sees self + all subordinates
 */

class TeamSelector {
  constructor(currentUser) {
    this.currentUser = currentUser;
    this.selectedScope = 'me'; // 'me' | 'team' | 'all' | 'user:{id}'
    this.teamMembers = [];
    this.loadScopeFromStorage();
  }

  async init() {
    await this.loadTeamMembers();
    return this;
  }

  async loadTeamMembers() {
    try {
      // Get all users in the same org that current user manages (or all if super_admin)
      const { data: users, error } = await window.supabaseClient
        .from('users')
        .select('id, name, email, role, manager_id')
        .eq('org_id', this.currentUser.org_id)
        .order('name');

      if (error) throw error;

      // Build hierarchy: who does current user manage?
      const canManage = this.buildManagementTree(users);

      this.teamMembers = users.filter(u =>
        u.id === this.currentUser.id || canManage.includes(u.id)
      );

      console.log('[TeamSelector] Team members:', this.teamMembers.length);
    } catch (err) {
      console.error('[TeamSelector] Failed to load team:', err);
      this.teamMembers = [this.currentUser];
    }
  }

  buildManagementTree(allUsers) {
    const isSuperAdmin = ['super_duper_admin', 'super_admin'].includes(this.currentUser.role);

    // Super admins see everyone
    if (isSuperAdmin) {
      return allUsers.map(u => u.id);
    }

    // Build who manages whom
    const manages = [this.currentUser.id]; // Start with self
    const userMap = {};
    allUsers.forEach(u => userMap[u.id] = u);

    // Find direct reports
    const directReports = allUsers.filter(u => u.manager_id === this.currentUser.id);
    directReports.forEach(u => manages.push(u.id));

    // Find indirect reports (reports of reports, recursively)
    const findSubordinates = (managerId) => {
      const reports = allUsers.filter(u => u.manager_id === managerId);
      reports.forEach(u => {
        if (!manages.includes(u.id)) {
          manages.push(u.id);
          findSubordinates(u.id); // Recursive
        }
      });
    };

    directReports.forEach(u => findSubordinates(u.id));

    return manages;
  }

  render(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const html = `
      <div class="team-selector">
        <div class="team-selector-label">Viewing Data For:</div>
        <div class="team-selector-buttons">
          <button
            class="team-selector-btn ${this.selectedScope === 'me' ? 'active' : ''}"
            onclick="window.teamSelector.setScope('me')">
            👤 Me Only
          </button>
          ${this.teamMembers.length > 1 ? `
            <button
              class="team-selector-btn ${this.selectedScope === 'team' ? 'active' : ''}"
              onclick="window.teamSelector.setScope('team')">
              👥 My Team (${this.teamMembers.length})
            </button>
          ` : ''}
          ${this.canSeeAll() ? `
            <button
              class="team-selector-btn ${this.selectedScope === 'all' ? 'active' : ''}"
              onclick="window.teamSelector.setScope('all')">
              🏢 All Org
            </button>
          ` : ''}
          ${this.teamMembers.length > 2 ? `
            <select
              class="team-selector-dropdown"
              onchange="window.teamSelector.setScope(this.value)"
              ${!this.selectedScope.startsWith('user:') ? '' : `value="${this.selectedScope}"`}>
              <option value="">Select Individual...</option>
              ${this.teamMembers.map(u => `
                <option value="user:${u.id}" ${this.selectedScope === `user:${u.id}` ? 'selected' : ''}>
                  ${u.name || u.email} ${u.id === this.currentUser.id ? '(You)' : ''}
                </option>
              `).join('')}
            </select>
          ` : ''}
        </div>
        <div class="team-selector-info" id="team-selector-info"></div>
      </div>
    `;

    container.innerHTML = html;
    this.updateInfo();
  }

  setScope(scope) {
    this.selectedScope = scope;
    this.saveScopeToStorage();
    this.updateInfo();

    // Trigger refresh event
    window.dispatchEvent(new CustomEvent('team-scope-changed', {
      detail: { scope, userIds: this.getFilteredUserIds() }
    }));
  }

  getFilteredUserIds() {
    if (this.selectedScope === 'me') {
      return [this.currentUser.id];
    } else if (this.selectedScope === 'team') {
      return this.teamMembers.map(u => u.id);
    } else if (this.selectedScope === 'all') {
      return null; // null = no filter (all org)
    } else if (this.selectedScope.startsWith('user:')) {
      const userId = this.selectedScope.replace('user:', '');
      return [userId];
    }
    return [this.currentUser.id]; // Default to self
  }

  getScopeLabel() {
    if (this.selectedScope === 'me') {
      return 'Your personal';
    } else if (this.selectedScope === 'team') {
      return `Your team's (${this.teamMembers.length} members)`;
    } else if (this.selectedScope === 'all') {
      return 'All organization';
    } else if (this.selectedScope.startsWith('user:')) {
      const userId = this.selectedScope.replace('user:', '');
      const user = this.teamMembers.find(u => u.id === userId);
      return `${user?.name || user?.email || 'User'}'s`;
    }
    return 'Your';
  }

  updateInfo() {
    const infoEl = document.getElementById('team-selector-info');
    if (!infoEl) return;

    const userIds = this.getFilteredUserIds();
    const count = userIds ? userIds.length : this.teamMembers.length;

    infoEl.textContent = `Showing ${this.getScopeLabel()} data ${userIds ? `(${count} user${count > 1 ? 's' : ''})` : '(entire org)'}`;
  }

  canSeeAll() {
    return ['super_duper_admin', 'super_admin', 'admin', 'admin_m'].includes(this.currentUser.role);
  }

  saveScopeToStorage() {
    try {
      localStorage.setItem('team-selector-scope', this.selectedScope);
    } catch (err) {
      console.warn('[TeamSelector] Failed to save scope:', err);
    }
  }

  loadScopeFromStorage() {
    try {
      const saved = localStorage.getItem('team-selector-scope');
      if (saved) this.selectedScope = saved;
    } catch (err) {
      console.warn('[TeamSelector] Failed to load scope:', err);
    }
  }

  // Helper: Apply filter to Supabase query
  applyFilter(query) {
    const userIds = this.getFilteredUserIds();

    if (userIds === null) {
      // No filter - return all in org (already filtered by RLS)
      return query;
    } else {
      // Filter by specific user IDs
      return query.in('owner_id', userIds);
    }
  }
}

// Export
window.TeamSelector = TeamSelector;

console.log('[TeamSelector] Loaded');
