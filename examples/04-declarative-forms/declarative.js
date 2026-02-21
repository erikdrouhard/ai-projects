/**
 * Example 4: Declarative API with HTML Forms
 *
 * Demonstrates the declarative approach to WebMCP where HTML form
 * attributes (toolname, tooldescription, toolautosubmit) expose
 * forms as AI-callable tools without writing tool registration code.
 *
 * Key learning points:
 *   1. toolname — gives the form a tool identity
 *   2. tooldescription — tells agents what the form does
 *   3. toolautosubmit — allows agent to auto-submit (human-in-the-loop control)
 *   4. Form fields automatically become the tool's inputSchema
 *   5. Combining declarative forms with imperative tools
 *
 * Note: The declarative API is still being standardized. This example
 * uses a polyfill that reads form attributes and registers tools
 * automatically. In Chrome 146+, the browser handles this natively.
 */

// ── Polyfill: Auto-register forms with toolname attribute ─────────
//
// In Chrome 146+ with native WebMCP, the browser reads toolname/
// tooldescription attributes and auto-registers the forms as tools.
// This code simulates that behavior for other browsers.
//
function registerDeclarativeForms() {
  const forms = document.querySelectorAll('form[toolname]');

  forms.forEach((form) => {
    const toolName = form.getAttribute('toolname');
    const toolDescription =
      form.getAttribute('tooldescription') || `Submit the ${toolName} form`;
    const autoSubmit = form.hasAttribute('toolautosubmit');

    // Build inputSchema from form fields
    const properties = {};
    const required = [];

    form.querySelectorAll('input, select, textarea').forEach((field) => {
      if (!field.name || field.type === 'submit') return;

      const prop = { description: field.placeholder || field.name };

      // Map HTML input types to JSON Schema types
      switch (field.type) {
        case 'number':
        case 'range':
          prop.type = 'number';
          break;
        case 'date':
          prop.type = 'string';
          prop.format = 'date';
          break;
        case 'email':
          prop.type = 'string';
          prop.format = 'email';
          break;
        case 'checkbox':
          prop.type = 'boolean';
          break;
        default:
          prop.type = 'string';
      }

      // Extract enum values from <select> elements
      if (field.tagName === 'SELECT') {
        const options = Array.from(field.options)
          .filter((o) => o.value)
          .map((o) => o.value);
        if (options.length > 0) {
          prop.enum = options;
        }
      }

      properties[field.name] = prop;

      if (field.required) {
        required.push(field.name);
      }
    });

    // Register the tool
    navigator.modelContext.registerTool({
      name: toolName,
      description: toolDescription,
      inputSchema: {
        type: 'object',
        properties,
        required: required.length > 0 ? required : undefined,
      },
      annotations: {
        // Declarative forms that don't autosubmit need human confirmation
        humanConfirmationRequired: !autoSubmit,
      },
      async execute(args) {
        // Fill in form fields with the provided arguments
        Object.entries(args).forEach(([key, value]) => {
          const field = form.querySelector(`[name="${key}"]`);
          if (field) {
            field.value = value;
            // Trigger change event so any listeners fire
            field.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });

        if (autoSubmit) {
          // Auto-submit: dispatch submit event
          form.dispatchEvent(new Event('submit', { cancelable: true }));
          return {
            content: [
              {
                type: 'text',
                text: `Form "${toolName}" auto-submitted with: ${JSON.stringify(args)}`,
              },
            ],
          };
        } else {
          // No autosubmit: fields are filled but user must click submit
          return {
            content: [
              {
                type: 'text',
                text: `Form "${toolName}" populated. Waiting for user to review and submit. Fields: ${JSON.stringify(args)}`,
              },
            ],
          };
        }
      },
    });

    console.log(
      `[Declarative] Registered form tool: ${toolName} (autosubmit: ${autoSubmit})`
    );
  });
}

// ── Form submission handlers ──────────────────────────────────────

document.getElementById('reservation-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form));

  const resultEl = document.getElementById('booking-result');
  const detailsEl = document.getElementById('booking-details');

  detailsEl.textContent = `Table for ${data.party_size} on ${data.date} at ${data.time} under "${data.guest_name}". ${data.special_requests ? 'Special requests: ' + data.special_requests : ''}`;
  resultEl.style.display = 'block';
});

document.getElementById('feedback-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form));

  const resultEl = document.getElementById('feedback-result');
  const detailsEl = document.getElementById('feedback-details');

  const stars = '★'.repeat(parseInt(data.rating)) + '☆'.repeat(5 - parseInt(data.rating));
  detailsEl.textContent = `Rating: ${stars} ${data.comments ? '— "' + data.comments + '"' : ''}`;
  resultEl.style.display = 'block';
});

// ── Initialize declarative tools ──────────────────────────────────
registerDeclarativeForms();

// ── Demo: Simulate agent filling a form ───────────────────────────
setTimeout(async () => {
  console.log('[Demo] Simulating agent making a reservation...');

  await navigator.modelContext.callTool('make_reservation', {
    guest_name: 'AI Agent Demo',
    date: '2026-03-15',
    time: '19:00',
    party_size: '4',
    special_requests: 'Window seat please, celebrating a birthday',
  });

  // The feedback form has autosubmit, so it will submit automatically
  setTimeout(async () => {
    console.log('[Demo] Simulating agent submitting feedback...');
    await navigator.modelContext.callTool('submit_feedback', {
      rating: '5',
      comments: 'Excellent experience with WebMCP!',
    });
  }, 2000);
}, 3000);
