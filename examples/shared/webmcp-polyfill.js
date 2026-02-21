/**
 * WebMCP Polyfill for Learning Purposes
 *
 * This polyfill simulates the navigator.modelContext API so that
 * WebMCP examples work in browsers without native support (i.e., non-Chrome 146+).
 *
 * In production, you would use the official polyfill from @mcp-b/global.
 * This simplified version exists purely for educational clarity.
 *
 * Native API reference:
 *   - navigator.modelContext.registerTool(toolDefinition)
 *   - navigator.modelContext.provideContext({ tools: [...] })
 *   - navigator.modelContext.tools (readonly, current tool list)
 *
 * @see https://webmachinelearning.github.io/webmcp/
 */
(function () {
  'use strict';

  // Skip if native WebMCP is available
  if ('modelContext' in navigator) {
    console.log('[WebMCP] Native navigator.modelContext detected');
    return;
  }

  console.log('[WebMCP Polyfill] Installing navigator.modelContext polyfill');

  const registeredTools = new Map();
  const listeners = new Map();

  const modelContext = {
    /**
     * Register a single tool dynamically.
     *
     * @param {Object} tool - The tool definition
     * @param {string} tool.name - Unique tool identifier
     * @param {string} tool.description - Human-readable description
     * @param {Object} tool.inputSchema - JSON Schema v7 for parameters
     * @param {Function} tool.execute - Async function called when tool is invoked
     * @param {Object} [tool.annotations] - Optional hints (readOnlyHint, idempotentHint, etc.)
     * @returns {{ unregister: Function }} Handle to remove the tool
     */
    registerTool(tool) {
      if (!tool.name || !tool.description || !tool.execute) {
        throw new Error(
          'WebMCP: registerTool requires name, description, and execute'
        );
      }

      registeredTools.set(tool.name, {
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema || { type: 'object', properties: {} },
        execute: tool.execute,
        annotations: tool.annotations || {},
      });

      console.log(`[WebMCP Polyfill] Registered tool: ${tool.name}`);
      modelContext._emit('toolschanged');

      return {
        unregister() {
          registeredTools.delete(tool.name);
          console.log(`[WebMCP Polyfill] Unregistered tool: ${tool.name}`);
          modelContext._emit('toolschanged');
        },
      };
    },

    /**
     * Replace all base tools at once. Useful for SPAs where the full
     * tool set changes on navigation.
     *
     * @param {Object} context
     * @param {Array} context.tools - Array of tool definitions
     */
    provideContext({ tools }) {
      // Clear existing base tools
      registeredTools.clear();
      for (const tool of tools) {
        registeredTools.set(tool.name, {
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema || { type: 'object', properties: {} },
          execute: tool.execute,
          annotations: tool.annotations || {},
        });
      }
      console.log(
        `[WebMCP Polyfill] provideContext: replaced with ${tools.length} tools`
      );
      modelContext._emit('toolschanged');
    },

    /**
     * Get the current list of registered tools (without execute functions).
     */
    get tools() {
      return Array.from(registeredTools.values()).map((t) => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema,
        annotations: t.annotations,
      }));
    },

    /**
     * Call a registered tool by name. This simulates what an AI agent
     * or browser would do.
     *
     * @param {string} name - Tool name
     * @param {Object} args - Tool arguments matching inputSchema
     * @returns {Promise<Object>} Tool result
     */
    async callTool(name, args = {}) {
      const tool = registeredTools.get(name);
      if (!tool) {
        throw new Error(`WebMCP: Tool "${name}" not found`);
      }
      console.log(
        `[WebMCP Polyfill] Calling tool: ${name}`,
        JSON.stringify(args)
      );
      return tool.execute(args);
    },

    // Simple event emitter for toolschanged events
    addEventListener(event, callback) {
      if (!listeners.has(event)) listeners.set(event, []);
      listeners.get(event).push(callback);
    },

    removeEventListener(event, callback) {
      const cbs = listeners.get(event);
      if (cbs) {
        listeners.set(
          event,
          cbs.filter((cb) => cb !== callback)
        );
      }
    },

    _emit(event) {
      const cbs = listeners.get(event);
      if (cbs) cbs.forEach((cb) => cb());
    },
  };

  Object.defineProperty(navigator, 'modelContext', {
    value: modelContext,
    writable: false,
    configurable: false,
  });

  console.log('[WebMCP Polyfill] Ready. navigator.modelContext is available.');
})();
