/**
 * useWebMCPTool — A React hook for registering WebMCP tools.
 *
 * This hook demonstrates how to integrate WebMCP with React's
 * component lifecycle. Tools are registered on mount and automatically
 * unregistered on unmount, preventing stale tool references.
 *
 * In production, you'd use the official @mcp-b/react-webmcp package,
 * which provides the useWebMCP() hook with Zod schema validation.
 * This simplified version teaches the core pattern.
 *
 * Usage:
 *   useWebMCPTool({
 *     name: 'my_tool',
 *     description: 'Does something',
 *     inputSchema: { type: 'object', properties: { ... } },
 *     execute: async (args) => { ... }
 *   });
 *
 * Key React considerations:
 *   - The execute function captures component state via closure
 *   - Re-registration happens when dependencies change (via useEffect deps)
 *   - Cleanup on unmount prevents agents from calling stale tools
 */
import { useEffect, useRef } from 'react';

export function useWebMCPTool(toolDefinition) {
  const handleRef = useRef(null);

  useEffect(() => {
    // Unregister previous version if dependencies changed
    if (handleRef.current) {
      handleRef.current.unregister();
    }

    // Register the tool
    handleRef.current = navigator.modelContext.registerTool(toolDefinition);

    // Cleanup on unmount or dependency change
    return () => {
      if (handleRef.current) {
        handleRef.current.unregister();
        handleRef.current = null;
      }
    };
    // Re-register when the tool definition changes
    // In practice, you'd memoize the toolDefinition to control this
  }, [toolDefinition.name]);
}
