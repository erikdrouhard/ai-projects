/**
 * WebMCP Polyfill (ES module version for React/Vite)
 *
 * Same functionality as ../shared/webmcp-polyfill.js but exported
 * as an ES module for use with bundlers.
 */

if (!('modelContext' in navigator)) {
  const registeredTools = new Map();
  const listeners = new Map();

  const modelContext = {
    registerTool(tool) {
      if (!tool.name || !tool.description || !tool.execute) {
        throw new Error('WebMCP: registerTool requires name, description, and execute');
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
          modelContext._emit('toolschanged');
        },
      };
    },

    provideContext({ tools }) {
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
      modelContext._emit('toolschanged');
    },

    get tools() {
      return Array.from(registeredTools.values()).map((t) => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema,
        annotations: t.annotations,
      }));
    },

    async callTool(name, args = {}) {
      const tool = registeredTools.get(name);
      if (!tool) throw new Error(`WebMCP: Tool "${name}" not found`);
      return tool.execute(args);
    },

    addEventListener(event, callback) {
      if (!listeners.has(event)) listeners.set(event, []);
      listeners.get(event).push(callback);
    },

    removeEventListener(event, callback) {
      const cbs = listeners.get(event);
      if (cbs) {
        listeners.set(event, cbs.filter((cb) => cb !== callback));
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
}
