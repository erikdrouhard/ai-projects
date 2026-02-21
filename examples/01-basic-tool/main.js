/**
 * Example 1: Basic Tool Registration
 *
 * This is the simplest possible WebMCP example. It demonstrates:
 *   1. Feature detection for WebMCP support
 *   2. Registering a tool with navigator.modelContext.registerTool()
 *   3. Defining an inputSchema using JSON Schema v7
 *   4. Returning structured results from the execute function
 *
 * What AI agents see:
 *   An agent visiting this page discovers two tools:
 *   - "greet" — generates a greeting for a given name
 *   - "get_page_info" — returns metadata about the current page
 */

// ── Utility: logging ──────────────────────────────────────────────
function log(message) {
  const area = document.getElementById('log-area');
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  const now = new Date().toLocaleTimeString();
  entry.innerHTML = `<span class="time">[${now}]</span> <span class="msg">${message}</span>`;
  area.appendChild(entry);
  area.scrollTop = area.scrollHeight;
}

// ── Step 1: Feature detection ─────────────────────────────────────
const statusEl = document.getElementById('support-status');
if ('modelContext' in navigator) {
  statusEl.textContent = 'WebMCP Supported';
  statusEl.className = 'status supported';
  log('navigator.modelContext is available');
} else {
  statusEl.textContent = 'Not Supported (polyfill not loaded)';
  statusEl.className = 'status unsupported';
  log('WebMCP not available — check that the polyfill loaded');
}

// ── Step 2: Register the "greet" tool ─────────────────────────────
//
// Every tool needs:
//   name         — unique identifier (snake_case by convention)
//   description  — natural language explanation for agents
//   inputSchema  — JSON Schema v7 describing accepted parameters
//   execute      — async function that performs the action
//
navigator.modelContext.registerTool({
  name: 'greet',
  description: 'Generate a personalized greeting message for a given name',
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'The name of the person to greet',
      },
      style: {
        type: 'string',
        enum: ['formal', 'casual', 'enthusiastic'],
        description: 'The greeting style to use',
      },
    },
    required: ['name'],
  },
  async execute(args) {
    const { name, style = 'casual' } = args;

    let greeting;
    switch (style) {
      case 'formal':
        greeting = `Good day, ${name}. It is a pleasure to make your acquaintance.`;
        break;
      case 'enthusiastic':
        greeting = `Hey ${name}! So awesome to meet you! Welcome aboard!`;
        break;
      case 'casual':
      default:
        greeting = `Hi there, ${name}! Welcome to WebMCP.`;
        break;
    }

    // Update the UI — tools can manipulate the DOM
    document.getElementById('greeting-output').textContent = greeting;
    log(`greet tool called: name="${name}", style="${style}"`);

    // Return structured content (MCP-compatible format)
    return {
      content: [{ type: 'text', text: greeting }],
    };
  },
});

// ── Step 3: Register the "get_page_info" tool ─────────────────────
//
// This is a read-only tool — note the readOnlyHint annotation.
// Annotations help agents understand tool behavior.
//
navigator.modelContext.registerTool({
  name: 'get_page_info',
  description: 'Returns metadata about the current page including title, URL, and example count',
  inputSchema: {
    type: 'object',
    properties: {},
  },
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
  },
  async execute() {
    const info = {
      title: document.title,
      url: window.location.href,
      example: 'Example 1: Basic Tool Registration',
      totalExamples: 5,
      webmcpSupported: 'modelContext' in navigator,
    };

    log('get_page_info tool called');

    return {
      content: [{ type: 'text', text: JSON.stringify(info, null, 2) }],
    };
  },
});

// ── Step 4: Display registered tools ──────────────────────────────
function renderTools() {
  const list = document.getElementById('tools-list');
  const tools = navigator.modelContext.tools;

  list.innerHTML = tools
    .map(
      (tool) => `
    <div style="background: #0f172a; padding: 1rem; border-radius: 8px; margin-bottom: 0.5rem;">
      <strong style="color: #fbbf24; font-family: monospace;">${tool.name}</strong>
      <span style="color: #64748b; margin-left: 0.5rem; font-size: 0.85rem;">
        ${tool.annotations?.readOnlyHint ? '[read-only]' : '[read-write]'}
      </span>
      <p style="color: #94a3b8; margin-top: 0.25rem; font-size: 0.9rem;">${tool.description}</p>
      <details style="margin-top: 0.5rem;">
        <summary style="color: #7dd3fc; cursor: pointer; font-size: 0.85rem;">Input Schema</summary>
        <pre style="margin-top: 0.5rem;"><code style="color: #a5f3fc; font-size: 0.8rem;">${JSON.stringify(tool.inputSchema, null, 2)}</code></pre>
      </details>
    </div>
  `
    )
    .join('');
}

renderTools();

// ── Step 5: Demo — simulate an agent calling tools ────────────────
//
// In real usage, the browser or an AI agent calls tools.
// Here we simulate it so you can see tools in action.
//
log('Tools registered. Simulating agent call in 2 seconds...');

setTimeout(async () => {
  log('Agent: calling greet({name: "Developer", style: "enthusiastic"})');
  const result = await navigator.modelContext.callTool('greet', {
    name: 'Developer',
    style: 'enthusiastic',
  });
  log(`Agent: received → ${result.content[0].text}`);
}, 2000);

setTimeout(async () => {
  log('Agent: calling get_page_info()');
  const result = await navigator.modelContext.callTool('get_page_info', {});
  log(`Agent: received page info`);
}, 3500);
