/**
 * AI Coaching Integration for IGNITE Sales OS (system/index.html)
 * Adds "Get AI Coaching" buttons to 4U evidence textareas
 *
 * INSTALLATION:
 * 1. Add <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script> to HTML
 * 2. Add <script src="../supabase-client.js"></script>
 * 3. Add <script src="./add-ai-coaching.js"></script>
 * 4. Call initAICoaching() after page load
 */

// Initialize AI Coaching for all 4U gates
function initAICoaching() {
  // Find all 4U textarea elements and add AI button next to them
  const gates = [
    { id: '4u-uw-evidence', label: 'Unworkable', color: '#C2410C' },
    { id: '4u-uv-evidence', label: 'Unavoidable', color: '#1E40AF' },
    { id: '4u-urg-evidence', label: 'Urgent', color: '#D97706' },
    { id: '4u-us-evidence', label: 'Underserved', color: '#6B21A8' }
  ];

  gates.forEach(gate => {
    // Find textarea by looking for placeholder text patterns
    const textareas = document.querySelectorAll('textarea');
    let targetTextarea = null;

    textareas.forEach(ta => {
      const placeholder = ta.getAttribute('placeholder') || '';
      if (
        (gate.id === '4u-uw-evidence' && placeholder.includes('fundamentally broken')) ||
        (gate.id === '4u-uv-evidence' && placeholder.includes('impossible to ignore')) ||
        (gate.id === '4u-urg-evidence' && placeholder.includes('must be solved now')) ||
        (gate.id === '4u-us-evidence' && placeholder.includes('no existing solution'))
      ) {
        targetTextarea = ta;
      }
    });

    if (targetTextarea) {
      // Add data-gate-id for later reference
      targetTextarea.setAttribute('data-gate-id', gate.id);
      targetTextarea.setAttribute('data-gate-label', gate.label);

      // Create AI button container
      const aiContainer = document.createElement('div');
      aiContainer.style.cssText = 'margin-top:0.5rem;display:flex;gap:0.5rem;align-items:center';

      // Create "Get AI Coaching" button
      const aiButton = document.createElement('button');
      aiButton.textContent = '🤖 Get AI Coaching';
      aiButton.style.cssText = `
        background: ${gate.color};
        color: #fff;
        border: none;
        padding: 0.4rem 0.9rem;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 700;
        cursor: pointer;
        font-family: 'Outfit', sans-serif;
        transition: all 0.2s;
        letter-spacing: 0.3px;
      `;
      aiButton.onmouseover = () => aiButton.style.opacity = '0.85';
      aiButton.onmouseout = () => aiButton.style.opacity = '1';
      aiButton.onclick = () => getAICoaching(gate.id, gate.label, gate.color);

      aiContainer.appendChild(aiButton);

      // Create result container (hidden initially)
      const resultContainer = document.createElement('div');
      resultContainer.id = `ai-result-${gate.id}`;
      resultContainer.style.cssText = `
        display: none;
        margin-top: 0.75rem;
        background: #DBEAFE;
        border: 2px solid #3B82F6;
        border-radius: 8px;
        padding: 1rem;
      `;

      // Insert after textarea
      targetTextarea.parentNode.insertBefore(aiContainer, targetTextarea.nextSibling);
      aiContainer.parentNode.insertBefore(resultContainer, aiContainer.nextSibling);
    }
  });

  console.log('[AI Coaching] Initialized for 4U gates');
}

// Get AI coaching for a specific gate
async function getAICoaching(gateId, gateLabel, gateColor) {
  const textarea = document.querySelector(`textarea[data-gate-id="${gateId}"]`);
  const resultContainer = document.getElementById(`ai-result-${gateId}`);
  const button = event.target;

  if (!textarea || !resultContainer) {
    console.error('[AI Coaching] Elements not found');
    return;
  }

  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = '⏳ Thinking...';

  try {
    // Get current answer
    const currentAnswer = textarea.value;

    // Get Supabase client
    if (!window.supabaseClient) {
      throw new Error('Supabase client not initialized');
    }

    // Get session
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    // Get prospect name from header input
    const prospectInput = document.querySelector('.prospect-input');
    const prospectName = prospectInput ? prospectInput.value : 'this prospect';

    // Call AI coaching Edge Function
    const response = await fetch(`${window.supabaseClient.supabaseUrl}/functions/v1/ai-coaching`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        gateLabel: gateLabel,
        currentAnswer: currentAnswer,
        prospectName: prospectName,
        context: 'sales_os'  // Indicate this is from standalone Sales OS
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'AI coaching failed');
    }

    const coaching = await response.json();

    // Display results
    resultContainer.innerHTML = `
      <div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;color:#1E40AF;margin-bottom:0.75rem;letter-spacing:0.5px">
        🤖 AI Coach Says:
      </div>

      <div style="margin-bottom:1rem">
        <div style="font-size:0.75rem;font-weight:700;color:#1E40AF;margin-bottom:0.25rem">
          DRAFT ANSWER (review & edit before using):
        </div>
        <div id="draft-${gateId}" style="background:#fff;border-radius:6px;padding:0.75rem;font-size:0.85rem;color:#0D0C08;line-height:1.6">
          ${coaching.draft || 'No draft generated'}
        </div>
        <div style="font-size:0.7rem;color:#6B5D4F;margin-top:0.5rem">
          Confidence: ${(coaching.confidence || 'medium').toUpperCase()}
        </div>
      </div>

      ${coaching.weakEvidence && coaching.weakEvidence.length > 0 ? `
        <div style="margin-bottom:1rem">
          <div style="font-size:0.75rem;font-weight:700;color:#DC2626;margin-bottom:0.5rem">
            ⚠️ WEAK EVIDENCE FLAGS:
          </div>
          <ul style="margin:0;padding-left:1.5rem;color:#991B1B;font-size:0.8rem;line-height:1.8">
            ${coaching.weakEvidence.map(flag => `<li>${flag}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      <div style="margin-bottom:1rem">
        <div style="font-size:0.75rem;font-weight:700;color:#065F46;margin-bottom:0.5rem">
          ✅ NEXT BEST ACTION:
        </div>
        <div style="background:#D1FAE5;border-radius:6px;padding:0.75rem;font-size:0.85rem;color:#065F46;font-weight:600">
          ${coaching.nextAction || 'Keep gathering evidence'}
        </div>
      </div>

      <div style="display:flex;gap:0.5rem">
        <button onclick="acceptAIDraft('${gateId}')" style="background:#10B981;color:#fff;border:none;padding:0.5rem 1rem;border-radius:6px;font-size:0.75rem;font-weight:700;cursor:pointer;font-family:'Outfit',sans-serif">
          ✓ Use This Draft
        </button>
        <button onclick="dismissAICoaching('${gateId}')" style="background:#6B7280;color:#fff;border:none;padding:0.5rem 1rem;border-radius:6px;font-size:0.75rem;font-weight:700;cursor:pointer;font-family:'Outfit',sans-serif">
          ✕ Dismiss
        </button>
      </div>
    `;

    resultContainer.style.display = 'block';
    resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  } catch (err) {
    console.error('[AI Coaching] Error:', err);
    alert(`AI coaching failed: ${err.message}\n\nMake sure you're logged in and the database is available.`);
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
}

// Accept AI draft and fill textarea
function acceptAIDraft(gateId) {
  const textarea = document.querySelector(`textarea[data-gate-id="${gateId}"]`);
  const draftEl = document.getElementById(`draft-${gateId}`);

  if (!textarea || !draftEl) return;

  // Get draft text
  const draft = draftEl.textContent.trim();

  // Fill textarea
  textarea.value = draft;

  // Trigger save (if saveDraft function exists)
  if (typeof saveDraft === 'function') {
    saveDraft(gateId, draft);
  }

  // Dismiss coaching
  dismissAICoaching(gateId);

  // Show confirmation
  alert('✓ Draft accepted! Please review and edit as needed.');
}

// Dismiss AI coaching panel
function dismissAICoaching(gateId) {
  const resultContainer = document.getElementById(`ai-result-${gateId}`);
  if (resultContainer) {
    resultContainer.style.display = 'none';
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAICoaching);
} else {
  initAICoaching();
}
