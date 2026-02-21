/**
 * Example 5: React + WebMCP Integration
 *
 * Shows how to use WebMCP tools within a React application.
 * Key patterns demonstrated:
 *   1. Custom useWebMCPTool hook for lifecycle management
 *   2. Tools that access React state via closures
 *   3. Automatic cleanup on component unmount
 *   4. Component-scoped tool registration
 */
import './webmcp-polyfill.js';

import React, { useState, useCallback, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { useWebMCPTool } from './useWebMCPTool.js';

// ── Product Catalog Component ─────────────────────────────────────
// Registers tools that let agents search and filter products.

function ProductCatalog() {
  const [products] = useState([
    { id: 1, name: 'Mechanical Keyboard', category: 'electronics', price: 149.99, inStock: true },
    { id: 2, name: 'Ergonomic Mouse', category: 'electronics', price: 79.99, inStock: true },
    { id: 3, name: 'Standing Desk', category: 'furniture', price: 599.99, inStock: false },
    { id: 4, name: 'Monitor Light Bar', category: 'electronics', price: 49.99, inStock: true },
    { id: 5, name: 'Desk Mat', category: 'accessories', price: 29.99, inStock: true },
    { id: 6, name: 'USB-C Hub', category: 'electronics', price: 39.99, inStock: true },
    { id: 7, name: 'Laptop Stand', category: 'accessories', price: 59.99, inStock: true },
    { id: 8, name: 'Office Chair', category: 'furniture', price: 449.99, inStock: true },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [cart, setCart] = useState([]);
  const [log, setLog] = useState([]);

  const addLog = useCallback((msg) => {
    setLog((prev) => [...prev, { time: new Date().toLocaleTimeString(), msg }]);
  }, []);

  // Use refs to give tools access to current state
  const productsRef = useRef(products);
  const cartRef = useRef(cart);
  productsRef.current = products;
  cartRef.current = cart;

  // ── WebMCP Tool: search_products ──────────────────────────────
  useWebMCPTool({
    name: 'search_products',
    description: 'Search the product catalog by query and/or category',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search term to match against product names',
        },
        category: {
          type: 'string',
          enum: ['electronics', 'furniture', 'accessories'],
          description: 'Filter by product category',
        },
        in_stock_only: {
          type: 'boolean',
          description: 'Only show products that are in stock',
        },
      },
    },
    annotations: { readOnlyHint: true },
    async execute(args) {
      let results = [...productsRef.current];

      if (args.query) {
        const q = args.query.toLowerCase();
        results = results.filter((p) =>
          p.name.toLowerCase().includes(q)
        );
        setSearchQuery(args.query);
      }

      if (args.category) {
        results = results.filter((p) => p.category === args.category);
        setCategoryFilter(args.category);
      }

      if (args.in_stock_only) {
        results = results.filter((p) => p.inStock);
      }

      addLog(`search_products(${JSON.stringify(args)}) → ${results.length} results`);

      return {
        content: [{
          type: 'text',
          text: results.length === 0
            ? 'No products found matching your criteria.'
            : results.map((p) =>
                `${p.name} — $${p.price} (${p.category}) ${p.inStock ? '✓ In Stock' : '✗ Out of Stock'}`
              ).join('\n'),
        }],
      };
    },
  });

  // ── WebMCP Tool: add_to_cart ──────────────────────────────────
  useWebMCPTool({
    name: 'add_to_cart',
    description: 'Add a product to the shopping cart by its ID',
    inputSchema: {
      type: 'object',
      properties: {
        product_id: {
          type: 'number',
          description: 'The ID of the product to add',
        },
        quantity: {
          type: 'number',
          description: 'Number of items to add (default: 1)',
        },
      },
      required: ['product_id'],
    },
    async execute(args) {
      const product = productsRef.current.find((p) => p.id === args.product_id);
      if (!product) {
        return { content: [{ type: 'text', text: `Product #${args.product_id} not found` }] };
      }
      if (!product.inStock) {
        return { content: [{ type: 'text', text: `"${product.name}" is out of stock` }] };
      }

      const qty = args.quantity || 1;
      setCart((prev) => {
        const existing = prev.find((item) => item.product.id === product.id);
        if (existing) {
          return prev.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + qty }
              : item
          );
        }
        return [...prev, { product, quantity: qty }];
      });

      addLog(`add_to_cart(#${product.id}, qty=${qty}) → Added "${product.name}"`);

      return {
        content: [{
          type: 'text',
          text: `Added ${qty}x "${product.name}" ($${product.price}) to cart`,
        }],
      };
    },
  });

  // ── WebMCP Tool: get_cart ─────────────────────────────────────
  useWebMCPTool({
    name: 'get_cart',
    description: 'Returns the current shopping cart contents and total',
    inputSchema: { type: 'object', properties: {} },
    annotations: { readOnlyHint: true },
    async execute() {
      const currentCart = cartRef.current;
      if (currentCart.length === 0) {
        return { content: [{ type: 'text', text: 'Cart is empty' }] };
      }

      const total = currentCart.reduce(
        (sum, item) => sum + item.product.price * item.quantity, 0
      );

      const summary = currentCart
        .map((item) => `${item.quantity}x ${item.product.name} — $${(item.product.price * item.quantity).toFixed(2)}`)
        .join('\n');

      addLog(`get_cart() → ${currentCart.length} items, $${total.toFixed(2)} total`);

      return {
        content: [{
          type: 'text',
          text: `${summary}\n\nTotal: $${total.toFixed(2)}`,
        }],
      };
    },
  });

  // ── Filtered products for display ─────────────────────────────
  const filteredProducts = products.filter((p) => {
    const matchesSearch = !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity, 0
  );

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Example 5: React + WebMCP</h1>
      <p style={styles.subtitle}>
        Product catalog with search, cart, and AI-callable tools
      </p>

      <div style={styles.concept}>
        <h3 style={styles.conceptTitle}>Key Concept: React Lifecycle Integration</h3>
        <p style={styles.conceptText}>
          The <code>useWebMCPTool</code> hook registers tools when a component
          mounts and unregisters them on unmount. This means tools are scoped to
          components — if a component is conditionally rendered, its tools appear
          and disappear with it. Tools access current React state through refs
          to avoid stale closures.
        </p>
      </div>

      {/* Search and filter controls */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Search Products</h2>
        <div style={styles.searchRow}>
          <input
            style={styles.input}
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select
            style={styles.select}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="electronics">Electronics</option>
            <option value="furniture">Furniture</option>
            <option value="accessories">Accessories</option>
          </select>
        </div>
      </div>

      {/* Product list */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Products ({filteredProducts.length})</h2>
        <div style={styles.productGrid}>
          {filteredProducts.map((product) => (
            <div key={product.id} style={styles.productCard}>
              <div style={styles.productName}>{product.name}</div>
              <div style={styles.productMeta}>
                <span style={styles.productPrice}>${product.price}</span>
                <span style={styles.productCategory}>{product.category}</span>
              </div>
              <div style={{
                ...styles.stockBadge,
                backgroundColor: product.inStock ? '#065f46' : '#7f1d1d',
                color: product.inStock ? '#6ee7b7' : '#fca5a5',
              }}>
                {product.inStock ? 'In Stock' : 'Out of Stock'}
              </div>
              <button
                style={{
                  ...styles.addButton,
                  opacity: product.inStock ? 1 : 0.5,
                }}
                disabled={!product.inStock}
                onClick={() => {
                  setCart((prev) => {
                    const existing = prev.find((item) => item.product.id === product.id);
                    if (existing) {
                      return prev.map((item) =>
                        item.product.id === product.id
                          ? { ...item, quantity: item.quantity + 1 }
                          : item
                      );
                    }
                    return [...prev, { product, quantity: 1 }];
                  });
                }}
              >
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Shopping cart */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>
          Shopping Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)} items)
        </h2>
        {cart.length === 0 ? (
          <p style={styles.emptyState}>Cart is empty</p>
        ) : (
          <>
            {cart.map((item) => (
              <div key={item.product.id} style={styles.cartItem}>
                <span>{item.quantity}x {item.product.name}</span>
                <span style={styles.cartPrice}>
                  ${(item.product.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
            <div style={styles.cartTotal}>
              <strong>Total: ${cartTotal.toFixed(2)}</strong>
            </div>
          </>
        )}
      </div>

      {/* WebMCP tool info */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Registered WebMCP Tools</h2>
        {navigator.modelContext.tools.map((tool) => (
          <div key={tool.name} style={styles.toolInfo}>
            <code style={styles.toolName}>{tool.name}</code>
            {tool.annotations?.readOnlyHint && (
              <span style={styles.readOnlyBadge}>[read-only]</span>
            )}
            <p style={styles.toolDesc}>{tool.description}</p>
          </div>
        ))}
      </div>

      <div style={styles.concept}>
        <h3 style={styles.conceptTitle}>Key Concept: Production Considerations</h3>
        <p style={styles.conceptText}>
          In production, use <code>@mcp-b/react-webmcp</code> which provides the
          official <code>useWebMCP()</code> hook with Zod schema validation, type
          safety, and optimized re-rendering. This example uses a simplified hook
          to teach the underlying pattern. Also consider using{' '}
          <code>useMemo</code> for tool definitions to prevent unnecessary
          re-registration on every render.
        </p>
      </div>

      {/* Activity log */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Tool Activity Log</h2>
        <div style={styles.logArea}>
          {log.length === 0 ? (
            <p style={styles.emptyState}>No tool calls yet</p>
          ) : (
            log.map((entry, i) => (
              <div key={i} style={styles.logEntry}>
                <span style={styles.logTime}>[{entry.time}]</span>{' '}
                <span>{entry.msg}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────
const styles = {
  container: { fontFamily: 'system-ui, sans-serif', maxWidth: 800, margin: '0 auto', padding: '2rem', background: '#0f172a', color: '#e2e8f0', minHeight: '100vh' },
  title: { color: '#38bdf8', marginBottom: '0.5rem' },
  subtitle: { color: '#94a3b8', marginBottom: '2rem' },
  card: { background: '#1e293b', borderRadius: 12, padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid #334155' },
  cardTitle: { color: '#7dd3fc', marginBottom: '1rem', fontSize: '1.1rem' },
  concept: { background: '#1e1b4b', border: '1px solid #3730a3', borderRadius: 8, padding: '1rem', margin: '1rem 0' },
  conceptTitle: { color: '#a78bfa', marginBottom: '0.5rem', fontSize: '0.95rem' },
  conceptText: { color: '#c4b5fd', fontSize: '0.9rem', lineHeight: 1.6 },
  searchRow: { display: 'flex', gap: '0.5rem' },
  input: { flex: 1, padding: '0.75rem', background: '#0f172a', border: '1px solid #475569', borderRadius: 8, color: '#e2e8f0', fontSize: '1rem' },
  select: { padding: '0.75rem', background: '#0f172a', border: '1px solid #475569', borderRadius: 8, color: '#e2e8f0', fontSize: '0.9rem' },
  productGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' },
  productCard: { background: '#0f172a', borderRadius: 8, padding: '1rem' },
  productName: { fontWeight: 600, marginBottom: '0.5rem' },
  productMeta: { display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' },
  productPrice: { color: '#38bdf8', fontWeight: 600 },
  productCategory: { color: '#94a3b8', fontSize: '0.85rem' },
  stockBadge: { display: 'inline-block', padding: '2px 8px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem' },
  addButton: { width: '100%', padding: '0.5rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 },
  cartItem: { display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #334155' },
  cartPrice: { color: '#38bdf8' },
  cartTotal: { paddingTop: '0.75rem', textAlign: 'right', fontSize: '1.1rem', color: '#22c55e' },
  emptyState: { color: '#64748b', textAlign: 'center', padding: '1rem' },
  toolInfo: { background: '#0f172a', padding: '0.75rem', borderRadius: 8, marginBottom: '0.5rem' },
  toolName: { color: '#fbbf24', fontFamily: 'monospace' },
  readOnlyBadge: { color: '#64748b', marginLeft: '0.5rem', fontSize: '0.85rem' },
  toolDesc: { color: '#94a3b8', marginTop: '0.25rem', fontSize: '0.9rem' },
  logArea: { background: '#0f172a', padding: '1rem', borderRadius: 8, maxHeight: 200, overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.85rem' },
  logEntry: { padding: '4px 0', borderBottom: '1px solid #1e293b' },
  logTime: { color: '#64748b' },
};

// ── Mount ─────────────────────────────────────────────────────────
createRoot(document.getElementById('root')).render(<ProductCatalog />);
