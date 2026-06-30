/**
 * IGNITE_APEX CRM — Task Reminder System
 *
 * Multi-channel reminder system:
 * 1. Browser push notifications
 * 2. In-app badge counters
 * 3. Dashboard alert section
 * 4. Email reminders (requires backend service - placeholder)
 *
 * Auto-initializes on 'ia:ready' event.
 * Checks tasks every 5 minutes.
 *
 * Requires: CRM client (window.CRM)
 */

(function () {
  'use strict';

  if (typeof window.CRM === 'undefined') {
    console.error('[TaskReminder] CRM client not found. Load crm-client.js first.');
    return;
  }

  const TaskReminder = {

    // Internal state
    _checkInterval: null,
    _notificationPermission: 'default',
    _overdueCount: 0,
    _dueTodayCount: 0,

    /**
     * Initialize the reminder system
     * - Request notification permission
     * - Start background worker (check every 5 minutes)
     * - Immediate first check
     */
    async init() {
      console.info('[TaskReminder] Initializing task reminder system...');

      // Request browser notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        this._notificationPermission = await Notification.requestPermission();
        if (this._notificationPermission === 'granted') {
          console.info('[TaskReminder] Notification permission granted');
        } else {
          console.warn('[TaskReminder] Notification permission denied - falling back to badges/alerts only');
        }
      } else if ('Notification' in window) {
        this._notificationPermission = Notification.permission;
      }

      // Start background worker - check every 30 minutes
      this._checkInterval = setInterval(() => this.checkReminders(), 30 * 60 * 1000);

      // Immediate check on load
      await this.checkReminders();

      console.info('[TaskReminder] Task reminder system initialized');
    },

    /**
     * Check for tasks needing reminders
     * Called every 5 minutes by background worker
     */
    async checkReminders() {
      if (!window.IAdb || !window.IAdb.isOnline || !window.IAdb.currentUser) {
        console.warn('[TaskReminder] Not online or not authenticated - skipping check');
        return;
      }

      const now = new Date();
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);

      try {
        // Get all pending tasks
        const tasks = await window.CRM.getMyTasks({ status: 'pending' });

        // Categorize tasks
        const overdue = [];
        const dueToday = [];
        const needsReminder = [];

        tasks.forEach(task => {
          if (!task.due_date) return; // Skip tasks with no due date

          const dueDate = new Date(task.due_date);

          // Overdue
          if (dueDate < now) {
            overdue.push(task);
          }
          // Due today
          else if (dueDate <= todayEnd) {
            dueToday.push(task);
          }

          // Reminder due (and not yet sent)
          if (
            task.reminder_date &&
            new Date(task.reminder_date) <= now &&
            !task.reminder_sent
          ) {
            needsReminder.push(task);
          }
        });

        // Update counts
        this._overdueCount = overdue.length;
        this._dueTodayCount = dueToday.length;

        // Update UI
        this.updateBadge(this._overdueCount);
        this.updateDashboardAlert(overdue, dueToday);

        // Send reminders
        for (const task of needsReminder) {
          await this.sendNotification(task);
        }

        console.info(
          `[TaskReminder] Check complete: ${overdue.length} overdue, ${dueToday.length} due today, ${needsReminder.length} reminders sent`
        );
      } catch (err) {
        console.error('[TaskReminder] Error checking reminders:', err);
      }
    },

    /**
     * Update badge counter on Tasks nav item
     * @param {number} count - Number of overdue tasks
     */
    updateBadge(count) {
      // Find Tasks nav item
      const taskNavItem = document.querySelector('[data-page="tasks"]');
      if (!taskNavItem) return;

      let badge = taskNavItem.querySelector('.task-badge');

      // Create badge if doesn't exist
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'task-badge';
        taskNavItem.appendChild(badge);
      }

      // Update count
      badge.textContent = count;
      badge.style.display = count > 0 ? 'inline-flex' : 'none';
    },

    /**
     * Update dashboard alert section
     * @param {Array} overdue - Overdue tasks
     * @param {Array} dueToday - Tasks due today
     */
    updateDashboardAlert(overdue, dueToday) {
      const alertContainer = document.getElementById('task-alert-banner');
      if (!alertContainer) return; // Not on dashboard page

      if (overdue.length === 0 && dueToday.length === 0) {
        alertContainer.style.display = 'none';
        return;
      }

      let html = '<div class="alert-header">⚠️ Task Alerts</div><ul class="alert-list">';

      if (overdue.length > 0) {
        html += `<li class="alert-overdue"><strong>${overdue.length}</strong> overdue task${
          overdue.length > 1 ? 's' : ''
        }</li>`;
      }

      if (dueToday.length > 0) {
        html += `<li class="alert-today"><strong>${dueToday.length}</strong> due today</li>`;
      }

      html += '</ul><a href="./tasks.html" class="alert-link">View Tasks →</a>';

      alertContainer.innerHTML = html;
      alertContainer.style.display = 'block';
    },

    /**
     * Send browser notification for a task
     * @param {Object} task - Task object
     */
    async sendNotification(task) {
      // Browser push notification
      if (this._notificationPermission === 'granted') {
        try {
          const notification = new Notification('⏰ Task Reminder', {
            body: task.subject,
            icon: '/icon.png', // TODO: Add app icon
            tag: task.id, // Prevents duplicate notifications
            requireInteraction: false,
            silent: false,
          });

          // Click handler - could navigate to task detail
          notification.onclick = () => {
            window.focus();
            window.location.href = `./tasks.html?id=${task.id}`;
            notification.close();
          };
        } catch (err) {
          console.error('[TaskReminder] Error showing notification:', err);
        }
      }

      // Mark reminder as sent (prevents spam)
      await window.CRM.updateTask(task.id, { reminder_sent: true });

      console.info(`[TaskReminder] Sent notification for task: ${task.subject}`);
    },

    /**
     * Manually trigger reminder check (for testing or immediate refresh)
     */
    async triggerCheck() {
      console.info('[TaskReminder] Manual check triggered');
      await this.checkReminders();
    },

    /**
     * Get current counts (for display in UI)
     * @returns {Object} { overdue: number, dueToday: number }
     */
    getCounts() {
      return {
        overdue: this._overdueCount,
        dueToday: this._dueTodayCount,
      };
    },

    /**
     * Stop the background worker (for cleanup)
     */
    stop() {
      if (this._checkInterval) {
        clearInterval(this._checkInterval);
        this._checkInterval = null;
        console.info('[TaskReminder] Task reminder system stopped');
      }
    },

  };

  // Expose globally
  window.TaskReminder = TaskReminder;

  // Auto-init on 'ia:ready' event (fired by supabase-client.js after auth)
  document.addEventListener('ia:ready', event => {
    if (event.detail && event.detail.online) {
      TaskReminder.init();
    } else {
      console.warn('[TaskReminder] Not online - reminder system deferred');
    }
  });

  console.info('[TaskReminder] Task reminder module loaded successfully');

})();
