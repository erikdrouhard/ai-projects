/**
 * Example 3: Todo App with Multiple WebMCP Tools
 *
 * A fully functional CRUD todo application that exposes its operations
 * as WebMCP tools. Demonstrates:
 *   1. Multiple coordinated tools that share state
 *   2. Complex inputSchema with enums and required fields
 *   3. Tools that return structured data (lists, statistics)
 *   4. Unique ID generation and item lookup
 *   5. How agents can chain tool calls to accomplish tasks
 */

// ── Application state ─────────────────────────────────────────────
let todos = [];
let nextId = 1;

// ── Logging ───────────────────────────────────────────────────────
function log(message) {
  const area = document.getElementById('log-area');
  if (!area) return;
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  const now = new Date().toLocaleTimeString();
  entry.innerHTML = `<span style="color:#64748b">[${now}]</span> ${message}`;
  area.appendChild(entry);
  area.scrollTop = area.scrollHeight;
}

// ── UI Rendering ──────────────────────────────────────────────────
function renderTodos() {
  const list = document.getElementById('todo-list');

  if (todos.length === 0) {
    list.innerHTML = '<li class="empty-state">No todos yet. Add one above!</li>';
  } else {
    list.innerHTML = todos
      .map(
        (todo) => `
      <li class="todo-item ${todo.completed ? 'completed' : ''}">
        <input type="checkbox" class="todo-checkbox"
          ${todo.completed ? 'checked' : ''}
          onchange="toggleTodo(${todo.id})">
        <span class="todo-text">${escapeHtml(todo.text)}</span>
        <span class="todo-priority priority-${todo.priority}">${todo.priority}</span>
        <button class="todo-delete" onclick="deleteTodo(${todo.id})">&times;</button>
      </li>
    `
      )
      .join('');
  }

  updateStats();
}

function updateStats() {
  const total = todos.length;
  const completed = todos.filter((t) => t.completed).length;
  const active = total - completed;
  const high = todos.filter((t) => t.priority === 'high' && !t.completed).length;

  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-active').textContent = active;
  document.getElementById('stat-completed').textContent = completed;
  document.getElementById('stat-high').textContent = high;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ── UI Event Handlers ─────────────────────────────────────────────
function addTodoFromUI() {
  const input = document.getElementById('todo-input');
  const priority = document.getElementById('todo-priority').value;
  const text = input.value.trim();

  if (!text) return;

  addTodo(text, priority, 'user');
  input.value = '';
  input.focus();
}

// Enter key support
document.getElementById('todo-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addTodoFromUI();
});

// ── Core Operations (shared by UI and tools) ──────────────────────
function addTodo(text, priority = 'medium', source = 'agent') {
  const todo = {
    id: nextId++,
    text,
    priority,
    completed: false,
    createdAt: new Date().toISOString(),
  };
  todos.push(todo);
  renderTodos();
  log(`<span style="color:${source === 'agent' ? '#c084fc' : '#38bdf8'}">[${source}]</span> Added: "${text}" (${priority})`);
  return todo;
}

function toggleTodo(id) {
  const todo = todos.find((t) => t.id === id);
  if (todo) {
    todo.completed = !todo.completed;
    renderTodos();
    log(`<span style="color:#38bdf8">[user]</span> Toggled #${id}: ${todo.completed ? 'completed' : 'active'}`);
  }
}

function deleteTodo(id) {
  const idx = todos.findIndex((t) => t.id === id);
  if (idx !== -1) {
    const removed = todos.splice(idx, 1)[0];
    renderTodos();
    log(`<span style="color:#38bdf8">[user]</span> Deleted: "${removed.text}"`);
  }
}

// ── WebMCP Tool Registration ──────────────────────────────────────

// Tool 1: add_todo
navigator.modelContext.registerTool({
  name: 'add_todo',
  description: 'Add a new todo item with text and priority level',
  inputSchema: {
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: 'The todo item text',
      },
      priority: {
        type: 'string',
        enum: ['low', 'medium', 'high'],
        description: 'Priority level (default: medium)',
      },
    },
    required: ['text'],
  },
  async execute(args) {
    const todo = addTodo(args.text, args.priority || 'medium', 'agent');
    return {
      content: [
        {
          type: 'text',
          text: `Created todo #${todo.id}: "${todo.text}" (${todo.priority})`,
        },
      ],
    };
  },
});

// Tool 2: list_todos
navigator.modelContext.registerTool({
  name: 'list_todos',
  description: 'List all todos, optionally filtered by status or priority',
  inputSchema: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        enum: ['all', 'active', 'completed'],
        description: 'Filter by completion status (default: all)',
      },
      priority: {
        type: 'string',
        enum: ['low', 'medium', 'high'],
        description: 'Filter by priority level (optional)',
      },
    },
  },
  annotations: {
    readOnlyHint: true,
  },
  async execute(args) {
    let filtered = [...todos];

    if (args.status === 'active') {
      filtered = filtered.filter((t) => !t.completed);
    } else if (args.status === 'completed') {
      filtered = filtered.filter((t) => t.completed);
    }

    if (args.priority) {
      filtered = filtered.filter((t) => t.priority === args.priority);
    }

    log(`<span style="color:#c084fc">[agent]</span> list_todos(${JSON.stringify(args)}) → ${filtered.length} results`);

    const summary = filtered.length === 0
      ? 'No todos found matching the criteria.'
      : filtered
          .map(
            (t) =>
              `#${t.id} [${t.completed ? 'x' : ' '}] (${t.priority}) ${t.text}`
          )
          .join('\n');

    return {
      content: [{ type: 'text', text: summary }],
    };
  },
});

// Tool 3: toggle_todo
navigator.modelContext.registerTool({
  name: 'toggle_todo',
  description: 'Toggle a todo item between completed and active by its ID',
  inputSchema: {
    type: 'object',
    properties: {
      id: {
        type: 'number',
        description: 'The ID of the todo item to toggle',
      },
    },
    required: ['id'],
  },
  async execute(args) {
    const todo = todos.find((t) => t.id === args.id);
    if (!todo) {
      return {
        content: [{ type: 'text', text: `Todo #${args.id} not found` }],
      };
    }

    todo.completed = !todo.completed;
    renderTodos();
    log(`<span style="color:#c084fc">[agent]</span> Toggled #${args.id}: ${todo.completed ? 'completed' : 'active'}`);

    return {
      content: [
        {
          type: 'text',
          text: `Todo #${args.id} is now ${todo.completed ? 'completed' : 'active'}: "${todo.text}"`,
        },
      ],
    };
  },
});

// Tool 4: delete_todo
navigator.modelContext.registerTool({
  name: 'delete_todo',
  description: 'Permanently delete a todo item by its ID',
  inputSchema: {
    type: 'object',
    properties: {
      id: {
        type: 'number',
        description: 'The ID of the todo item to delete',
      },
    },
    required: ['id'],
  },
  async execute(args) {
    const idx = todos.findIndex((t) => t.id === args.id);
    if (idx === -1) {
      return {
        content: [{ type: 'text', text: `Todo #${args.id} not found` }],
      };
    }

    const removed = todos.splice(idx, 1)[0];
    renderTodos();
    log(`<span style="color:#c084fc">[agent]</span> Deleted #${args.id}: "${removed.text}"`);

    return {
      content: [
        { type: 'text', text: `Deleted todo #${args.id}: "${removed.text}"` },
      ],
    };
  },
});

// Tool 5: get_stats
navigator.modelContext.registerTool({
  name: 'get_stats',
  description: 'Returns summary statistics about the todo list',
  inputSchema: {
    type: 'object',
    properties: {},
  },
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
  },
  async execute() {
    const stats = {
      total: todos.length,
      active: todos.filter((t) => !t.completed).length,
      completed: todos.filter((t) => t.completed).length,
      byPriority: {
        high: todos.filter((t) => t.priority === 'high').length,
        medium: todos.filter((t) => t.priority === 'medium').length,
        low: todos.filter((t) => t.priority === 'low').length,
      },
    };

    log(`<span style="color:#c084fc">[agent]</span> get_stats → ${stats.total} total, ${stats.active} active`);

    return {
      content: [{ type: 'text', text: JSON.stringify(stats, null, 2) }],
    };
  },
});

// Tool 6: clear_completed
navigator.modelContext.registerTool({
  name: 'clear_completed',
  description: 'Remove all completed todo items from the list',
  inputSchema: {
    type: 'object',
    properties: {},
  },
  async execute() {
    const count = todos.filter((t) => t.completed).length;
    todos = todos.filter((t) => !t.completed);
    renderTodos();
    log(`<span style="color:#c084fc">[agent]</span> clear_completed → removed ${count} items`);

    return {
      content: [{ type: 'text', text: `Cleared ${count} completed todos` }],
    };
  },
});

// ── Initialize ────────────────────────────────────────────────────
renderTodos();
log('6 tools registered: add_todo, list_todos, toggle_todo, delete_todo, get_stats, clear_completed');

// ── Demo: Simulate agent building a task list ─────────────────────
setTimeout(async () => {
  log('--- Simulated agent session ---');

  await navigator.modelContext.callTool('add_todo', {
    text: 'Read the WebMCP specification',
    priority: 'high',
  });

  setTimeout(async () => {
    await navigator.modelContext.callTool('add_todo', {
      text: 'Try the declarative forms example',
      priority: 'medium',
    });
  }, 800);

  setTimeout(async () => {
    await navigator.modelContext.callTool('add_todo', {
      text: 'Build a React integration',
      priority: 'medium',
    });
  }, 1600);

  setTimeout(async () => {
    await navigator.modelContext.callTool('toggle_todo', { id: 1 });
  }, 2400);

  setTimeout(async () => {
    await navigator.modelContext.callTool('get_stats');
    log('--- Agent session complete ---');
  }, 3200);
}, 2000);
