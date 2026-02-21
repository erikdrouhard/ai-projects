# WebMCP Learning Project

A hands-on project for understanding **WebMCP** (Web Model Context Protocol) — the W3C proposed standard that lets websites expose structured tools to AI agents through the browser's `navigator.modelContext` API.

## What is WebMCP?

WebMCP is a JavaScript API that enables web developers to expose application functionality as **tools** — functions with natural language descriptions and structured schemas that AI agents can discover and invoke directly in the browser.

**The problem it solves:** AI agents currently interact with websites by taking screenshots, parsing HTML, and simulating clicks — a slow, brittle, and expensive approach. WebMCP replaces this with a structured protocol where pages declare their capabilities.

**Key facts:**
- Co-developed by **Google** and **Microsoft** under the W3C Web Machine Learning Community Group
- Available in **Chrome 146+** behind a flag (`chrome://flags → WebMCP`)
- Achieves **89% token efficiency improvement** over screenshot-based methods
- Architecturally distinct from Anthropic's MCP (backend JSON-RPC) — WebMCP operates client-side in the browser

## Project Structure

```
webmcp-learning-project/
├── README.md
├── package.json
└── examples/
    ├── shared/
    │   └── webmcp-polyfill.js          # Polyfill for non-Chrome browsers
    ├── 01-basic-tool/                   # Your first WebMCP tool
    │   ├── index.html
    │   └── main.js
    ├── 02-counter-state/                # Tools with shared state
    │   ├── index.html
    │   └── main.js
    ├── 03-todo-app/                     # Multiple coordinated tools (CRUD)
    │   ├── index.html
    │   └── main.js
    ├── 04-declarative-forms/            # Declarative API with HTML attributes
    │   ├── index.html
    │   └── declarative.js
    └── 05-react-integration/            # React + WebMCP with custom hooks
        ├── package.json
        ├── vite.config.js
        ├── index.html
        └── src/
            ├── main.jsx
            ├── useWebMCPTool.js
            └── webmcp-polyfill.js
```

## Examples

### Example 1: Basic Tool Registration
**File:** `examples/01-basic-tool/`

Your first WebMCP tool. Learn:
- Feature detection (`'modelContext' in navigator`)
- `navigator.modelContext.registerTool()` API
- `inputSchema` with JSON Schema v7
- Returning structured results from `execute()`
- Tool annotations (`readOnlyHint`, `idempotentHint`)

### Example 2: Counter with State
**File:** `examples/02-counter-state/`

Tools that read and modify shared application state. Learn:
- UI and tools sharing the same state
- Read-only vs read-write tools
- Idempotent vs non-idempotent operations
- Default parameter values in schemas
- How agents and users collaborate on the same page

### Example 3: Todo App
**File:** `examples/03-todo-app/`

A complete CRUD application with six coordinated tools. Learn:
- Multiple tools working together (`add_todo`, `list_todos`, `toggle_todo`, `delete_todo`, `get_stats`, `clear_completed`)
- Complex `inputSchema` with enums and required fields
- Tools that return structured data (lists, statistics)
- How agents chain tool calls for complex tasks

### Example 4: Declarative Forms
**File:** `examples/04-declarative-forms/`

The declarative approach using HTML attributes. Learn:
- `toolname` and `tooldescription` form attributes
- `toolautosubmit` for human-in-the-loop control
- Browser auto-generating `inputSchema` from form fields
- When to use declarative vs imperative
- Side-by-side comparison of both approaches

### Example 5: React Integration
**File:** `examples/05-react-integration/`

WebMCP in a React application with a product catalog. Learn:
- Custom `useWebMCPTool` hook for lifecycle management
- Tools accessing React state via refs (avoiding stale closures)
- Automatic cleanup on component unmount
- Component-scoped tool registration

## Running the Examples

**Examples 1-4** (static HTML — no build step):
```bash
# Serve any example with a simple HTTP server
npx serve examples/01-basic-tool
npx serve examples/02-counter-state
npx serve examples/03-todo-app
npx serve examples/04-declarative-forms
```

**Example 5** (React — requires npm install):
```bash
cd examples/05-react-integration
npm install
npm run dev
```

## Core Concepts Reference

### The `registerTool()` API

```js
navigator.modelContext.registerTool({
  name: 'tool_name',              // Unique identifier (snake_case)
  description: 'What this does',  // Natural language for AI agents
  inputSchema: {                  // JSON Schema v7
    type: 'object',
    properties: {
      param: { type: 'string', description: 'A parameter' }
    },
    required: ['param']
  },
  annotations: {                  // Optional behavioral hints
    readOnlyHint: true,
    idempotentHint: true
  },
  async execute(args) {           // Called when agent invokes the tool
    return {
      content: [{ type: 'text', text: 'Result' }]
    };
  }
});
```

### Declarative API (HTML Attributes)

```html
<form toolname="search" tooldescription="Search products">
  <input name="query" type="text" required>
  <button type="submit">Search</button>
</form>
```

### Feature Detection

```js
if ('modelContext' in navigator) {
  // WebMCP is supported — register tools
} else {
  // Fallback or load polyfill
}
```

### WebMCP vs Anthropic MCP

| Aspect | WebMCP | Anthropic MCP |
|--------|--------|---------------|
| **Environment** | Client-side (browser) | Server-side (backend) |
| **Protocol** | Browser API (`navigator.modelContext`) | JSON-RPC over stdio/HTTP |
| **Purpose** | Website → AI agent interaction | Backend service → AI platform |
| **Registration** | `registerTool()` / HTML attributes | MCP server with tool definitions |
| **Security** | Same-origin, CSP, HTTPS | Auth tokens, transport security |

## Resources

- [W3C Specification](https://webmachinelearning.github.io/webmcp/)
- [GitHub: webmachinelearning/webmcp](https://github.com/webmachinelearning/webmcp)
- [GoogleChromeLabs/webmcp-tools](https://github.com/GoogleChromeLabs/webmcp-tools)
- [WebMCP-org/examples](https://github.com/WebMCP-org/examples)
- [@mcp-b/global (npm polyfill)](https://www.npmjs.com/package/@mcp-b/global)
- [@mcp-b/react-webmcp (React hooks)](https://www.npmjs.com/package/@mcp-b/react-webmcp)
- [Chrome 146 WebMCP Guide](https://bug0.com/blog/webmcp-chrome-146-guide)
