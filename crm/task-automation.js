/**
 * task-automation.js
 * Auto-create tasks when opportunity stage changes
 */

class TaskAutomation {
  /**
   * Check if stage change should trigger task creation
   * Returns tasks to create based on templates
   */
  static async getAutoTasksForStageChange(opportunity, oldStage, newStage) {
    if (!opportunity || oldStage === newStage) return [];

    try {
      const { data: templates, error } = await window.supabaseClient
        .from('task_templates')
        .select('*')
        .eq('org_id', opportunity.org_id)
        .eq('trigger_stage', newStage)
        .eq('is_active', true);

      if (error) throw error;

      return templates.map(template => ({
        template_id: template.id,
        template_name: template.name,
        type: template.task_type,
        subject: this.fillTemplate(template.subject_template, opportunity),
        description: this.fillTemplate(template.description_template, opportunity),
        due_date: this.calculateDueDate(template.due_days_offset),
        priority: template.priority,
        reminder_minutes: template.reminder_minutes,
        assigned_to: opportunity.owner_id,
        opportunity_id: opportunity.id,
        org_id: opportunity.org_id
      }));
    } catch (err) {
      console.error('[TaskAutomation] Error getting templates:', err);
      return [];
    }
  }

  /**
   * Fill template placeholders with opportunity data
   */
  static fillTemplate(template, opportunity) {
    if (!template) return '';

    return template
      .replace(/\{\{company_name\}\}/g, opportunity.company_name || opportunity.name || 'the company')
      .replace(/\{\{contact_name\}\}/g, opportunity.contact_name || 'the contact')
      .replace(/\{\{value\}\}/g, opportunity.estimated_value ? `$${opportunity.estimated_value}` : 'TBD')
      .replace(/\{\{stage\}\}/g, opportunity.pipeline_stage || 'unknown stage')
      .replace(/\{\{subject\}\}/g, opportunity.name || 'this opportunity');
  }

  /**
   * Calculate due date from offset
   */
  static calculateDueDate(daysOffset) {
    const date = new Date();
    date.setDate(date.getDate() + (daysOffset || 1));
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  /**
   * Create tasks in database
   */
  static async createTasks(tasks, createdBy) {
    if (!tasks || tasks.length === 0) return { created: [], errors: [] };

    const created = [];
    const errors = [];

    for (const task of tasks) {
      try {
        const { data, error } = await window.supabaseClient
          .from('tasks')
          .insert({
            ...task,
            status: 'pending',
            created_by: createdBy
          })
          .select()
          .single();

        if (error) throw error;

        created.push(data);
        console.log('[TaskAutomation] Created task:', task.template_name);
      } catch (err) {
        console.error('[TaskAutomation] Failed to create task:', err);
        errors.push({ task, error: err.message });
      }
    }

    return { created, errors };
  }

  /**
   * Show notification to user about auto-created tasks
   */
  static showNotification(tasksCreated) {
    if (tasksCreated.length === 0) return;

    const taskList = tasksCreated.map(t => `  • ${t.subject}`).join('\n');
    const message = `🎯 ${tasksCreated.length} task${tasksCreated.length > 1 ? 's' : ''} auto-created:\n\n${taskList}\n\nCheck the Tasks tab!`;

    // Show as alert for now (could be replaced with toast notification)
    setTimeout(() => {
      if (confirm(message + '\n\nGo to Tasks tab now?')) {
        const tasksTab = document.querySelector('.tab[onclick*="tasks"]');
        if (tasksTab) tasksTab.click();
      }
    }, 500);
  }

  /**
   * Main hook: call this when stage changes
   */
  static async handleStageChange(opportunity, oldStage, newStage, userId) {
    console.log('[TaskAutomation] Stage change detected:', oldStage, '→', newStage);

    // Get tasks to create
    const tasksToCreate = await this.getAutoTasksForStageChange(opportunity, oldStage, newStage);

    if (tasksToCreate.length === 0) {
      console.log('[TaskAutomation] No templates for stage:', newStage);
      return { created: [], errors: [] };
    }

    // Create tasks
    const result = await this.createTasks(tasksToCreate, userId);

    // Notify user
    if (result.created.length > 0) {
      this.showNotification(result.created);
    }

    return result;
  }
}

window.TaskAutomation = TaskAutomation;
console.log('[TaskAutomation] Loaded');
