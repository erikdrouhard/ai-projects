/**
 * Example 2: Counter with State Management
 *
 * Demonstrates how WebMCP tools can read and modify shared application state.
 * The same state (counter value) is accessible through:
 *   - The UI (buttons, display)
 *   - WebMCP tools (get, set, increment, decrement)
 *
 * Key learning points:
 *   1. Tools and UI share the same state
 *   2. Tool annotations (readOnlyHint, idempotentHint)
 *   3. Default parameter values in inputSchema
 *   4. Multiple tools working with the same data
 */

// ── Application state ─────────────────────────────────────────────
let counter = 0;

// ── UI helpers ────────────────────────────────────────────────────
function updateDisplay() {
  document.getElementById('counter-display').textContent = counter;
}

function log(message, source = 'system') {
  const area = document.getElementById('log-area');
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  const now = new Date().toLocaleTimeString();
  entry.innerHTML = `<span class="time">[${now}]</span> <span class="${source}">[${source}]</span> ${message}`;
  area.appendChild(entry);
  area.scrollTop = area.scrollHeight;
}

// ── UI event handlers (called by button clicks) ───────────────────
function increment() {
  counter++;
  updateDisplay();
  log(`Clicked +1 → counter is now ${counter}`, 'user');
}

function decrement() {
  counter--;
  updateDisplay();
  log(`Clicked -1 → counter is now ${counter}`, 'user');
}

function resetCounter() {
  counter = 0;
  updateDisplay();
  log('Clicked Reset → counter is now 0', 'user');
}

function setFromInput() {
  const input = document.getElementById('set-value');
  const val = parseInt(input.value, 10);
  if (isNaN(val)) {
    log('Invalid number entered', 'user');
    return;
  }
  counter = val;
  updateDisplay();
  log(`Set counter to ${counter} via input`, 'user');
  input.value = '';
}

// ── WebMCP Tool Registration ──────────────────────────────────────

// Tool 1: get_counter (read-only)
navigator.modelContext.registerTool({
  name: 'get_counter',
  description: 'Returns the current counter value',
  inputSchema: {
    type: 'object',
    properties: {},
  },
  annotations: {
    readOnlyHint: true,    // Does not modify state
    idempotentHint: true,  // Safe to call multiple times
  },
  async execute() {
    log(`get_counter called → returning ${counter}`, 'agent');
    return {
      content: [{ type: 'text', text: `Counter value: ${counter}` }],
    };
  },
});

// Tool 2: set_counter (write, idempotent)
navigator.modelContext.registerTool({
  name: 'set_counter',
  description: 'Sets the counter to a specific value',
  inputSchema: {
    type: 'object',
    properties: {
      value: {
        type: 'number',
        description: 'The value to set the counter to',
      },
    },
    required: ['value'],
  },
  annotations: {
    readOnlyHint: false,
    idempotentHint: true,  // Setting to same value repeatedly is safe
  },
  async execute(args) {
    const oldValue = counter;
    counter = args.value;
    updateDisplay();
    log(`set_counter(${args.value}) → changed from ${oldValue} to ${counter}`, 'agent');
    return {
      content: [
        {
          type: 'text',
          text: `Counter set from ${oldValue} to ${counter}`,
        },
      ],
    };
  },
});

// Tool 3: increment_counter (write, NOT idempotent)
navigator.modelContext.registerTool({
  name: 'increment_counter',
  description: 'Increases the counter by a given amount (default: 1)',
  inputSchema: {
    type: 'object',
    properties: {
      amount: {
        type: 'number',
        description: 'Amount to increment by (default: 1)',
        default: 1,
      },
    },
  },
  annotations: {
    readOnlyHint: false,
    idempotentHint: false,  // Calling twice doubles the effect
  },
  async execute(args) {
    const amount = args.amount ?? 1;
    const oldValue = counter;
    counter += amount;
    updateDisplay();
    log(`increment_counter(${amount}) → ${oldValue} + ${amount} = ${counter}`, 'agent');
    return {
      content: [
        {
          type: 'text',
          text: `Counter incremented by ${amount}: ${oldValue} → ${counter}`,
        },
      ],
    };
  },
});

// Tool 4: decrement_counter (write, NOT idempotent)
navigator.modelContext.registerTool({
  name: 'decrement_counter',
  description: 'Decreases the counter by a given amount (default: 1)',
  inputSchema: {
    type: 'object',
    properties: {
      amount: {
        type: 'number',
        description: 'Amount to decrement by (default: 1)',
        default: 1,
      },
    },
  },
  annotations: {
    readOnlyHint: false,
    idempotentHint: false,
  },
  async execute(args) {
    const amount = args.amount ?? 1;
    const oldValue = counter;
    counter -= amount;
    updateDisplay();
    log(`decrement_counter(${amount}) → ${oldValue} - ${amount} = ${counter}`, 'agent');
    return {
      content: [
        {
          type: 'text',
          text: `Counter decremented by ${amount}: ${oldValue} → ${counter}`,
        },
      ],
    };
  },
});

// ── Initialize ────────────────────────────────────────────────────
updateDisplay();
log('All tools registered. Try the buttons or simulate agent calls below.');

// ── Demo: Simulate agent interaction ──────────────────────────────
setTimeout(async () => {
  log('--- Simulated agent session ---', 'agent');

  // Agent reads the counter
  await navigator.modelContext.callTool('get_counter');

  // Agent increments by 5
  setTimeout(async () => {
    await navigator.modelContext.callTool('increment_counter', { amount: 5 });
  }, 1000);

  // Agent sets to 42
  setTimeout(async () => {
    await navigator.modelContext.callTool('set_counter', { value: 42 });
  }, 2000);

  // Agent reads again
  setTimeout(async () => {
    await navigator.modelContext.callTool('get_counter');
    log('--- Agent session complete ---', 'agent');
  }, 3000);
}, 2000);
