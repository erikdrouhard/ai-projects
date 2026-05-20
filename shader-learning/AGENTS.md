# Shader Learning Website

Interactive, browser-based course that teaches WebGL2 / GLSL shaders from
zero. Built with Vite + React + TypeScript. Every lesson has a Monaco code
editor on the left and a live WebGL2 preview on the right.

## Stack

- **Build / dev server**: Vite
- **UI**: React 18 + React Router
- **Code editor**: `@monaco-editor/react` (with a custom GLSL Monarch grammar)
- **Renderer**: hand-rolled WebGL2; a fullscreen triangle driven by a user
  fragment shader. See `src/lib/shaderRenderer.ts`.
- **Uniforms exposed to lessons**:
  - `u_resolution` (vec2, in physical pixels)
  - `u_time` (float, seconds since the shader was loaded)
  - `u_mouse` (vec2, in physical pixels, origin bottom-left)
  - `v_uv` (vec2, varying, 0..1 across the canvas)
- **Implicit preamble**: lesson code does not need `#version` or precision
  qualifiers — they're prepended automatically. If a lesson really needs
  the full preamble, write your own `#version 300 es` on line 1.

## Layout

```
shader-learning/
  src/
    components/   # ShaderCanvas, CodeEditor, LessonView, HomePage
    lessons/      # One file per lesson + index.ts + types.ts
    lib/          # shaderRenderer.ts (WebGL2)
    styles/       # global.css
    App.tsx
    main.tsx
```

## Adding a lesson

1. Create `src/lessons/NN-slug.ts` exporting a `Lesson`. Use the existing
   lessons as templates.
2. Add it to the `lessons` array in `src/lessons/index.ts` (order matters
   — that's the order in the sidebar and the prev/next pager).
3. Keep the difficulty curve gentle. The earliest lessons should change
   exactly one new idea at a time.

## Curriculum target

01. What is a shader? (solid color)
02. UV coordinates and gradients
03. Shaping functions: step, smoothstep, mix
04. SDF basics: circles and squares
05. Transforms: translate, rotate, scale
06. Patterns, tiling, polar coords
07. Randomness
08. Noise (value noise, fractal brownian motion)
09. Animation with time, easing
10. Onwards: vertex shaders, raymarching

## Dev commands

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build
npm run typecheck  # tsc --noEmit
```

## House rules

- All files for this project stay inside `shader-learning/`.
- Keep `CLAUDE.md` and `AGENTS.md` in this folder identical.
