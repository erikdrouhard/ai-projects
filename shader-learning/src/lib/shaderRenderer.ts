// Minimal WebGL2 renderer that draws a fullscreen triangle with a user-supplied
// fragment shader. Exposes standard Shadertoy-style uniforms.

const VERTEX_SHADER = `#version 300 es
precision highp float;
out vec2 v_uv;
void main() {
  // Fullscreen triangle covering the clip-space quad without a vertex buffer.
  vec2 pos = vec2(
    float((gl_VertexID & 1) << 2) - 1.0,
    float((gl_VertexID & 2) << 1) - 1.0
  );
  v_uv = pos * 0.5 + 0.5;
  gl_Position = vec4(pos, 0.0, 1.0);
}
`

const FRAGMENT_PREAMBLE = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 outColor;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
`

export type CompileResult =
  | { ok: true }
  | { ok: false; error: string }

export class ShaderRenderer {
  private gl: WebGL2RenderingContext
  private program: WebGLProgram | null = null
  private vao: WebGLVertexArrayObject
  private uniforms: {
    resolution: WebGLUniformLocation | null
    time: WebGLUniformLocation | null
    mouse: WebGLUniformLocation | null
  } = { resolution: null, time: null, mouse: null }
  private startTime = performance.now()
  private rafId = 0
  private mouse: [number, number] = [0, 0]
  private running = false
  private dpr = Math.min(window.devicePixelRatio || 1, 2)

  constructor(private canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl2', { antialias: true, premultipliedAlpha: false })
    if (!gl) throw new Error('WebGL2 is not supported in this browser.')
    this.gl = gl
    const vao = gl.createVertexArray()
    if (!vao) throw new Error('Failed to allocate VAO')
    this.vao = vao
  }

  setFragmentShader(source: string): CompileResult {
    const gl = this.gl
    const fullSource = source.includes('#version') ? source : FRAGMENT_PREAMBLE + source

    const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER)
    if (typeof vs === 'string') return { ok: false, error: `Vertex shader error: ${vs}` }

    const fs = compileShader(gl, gl.FRAGMENT_SHADER, fullSource)
    if (typeof fs === 'string') {
      gl.deleteShader(vs)
      return { ok: false, error: formatGLSLError(fs, fullSource) }
    }

    const program = gl.createProgram()
    if (!program) {
      gl.deleteShader(vs)
      gl.deleteShader(fs)
      return { ok: false, error: 'Failed to create program' }
    }
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    gl.deleteShader(vs)
    gl.deleteShader(fs)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(program) ?? 'Unknown link error'
      gl.deleteProgram(program)
      return { ok: false, error: `Link error: ${log}` }
    }

    if (this.program) gl.deleteProgram(this.program)
    this.program = program
    this.uniforms.resolution = gl.getUniformLocation(program, 'u_resolution')
    this.uniforms.time = gl.getUniformLocation(program, 'u_time')
    this.uniforms.mouse = gl.getUniformLocation(program, 'u_mouse')
    return { ok: true }
  }

  resetTime() {
    this.startTime = performance.now()
  }

  setMouse(x: number, y: number) {
    this.mouse = [x, y]
  }

  start() {
    if (this.running) return
    this.running = true
    const loop = () => {
      if (!this.running) return
      this.render()
      this.rafId = requestAnimationFrame(loop)
    }
    this.rafId = requestAnimationFrame(loop)
  }

  stop() {
    this.running = false
    cancelAnimationFrame(this.rafId)
  }

  private resize() {
    const canvas = this.canvas
    const displayWidth = Math.floor(canvas.clientWidth * this.dpr)
    const displayHeight = Math.floor(canvas.clientHeight * this.dpr)
    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth
      canvas.height = displayHeight
    }
  }

  private render() {
    if (!this.program) return
    const gl = this.gl
    this.resize()
    gl.viewport(0, 0, this.canvas.width, this.canvas.height)
    gl.useProgram(this.program)
    gl.bindVertexArray(this.vao)
    if (this.uniforms.resolution) gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height)
    if (this.uniforms.time) gl.uniform1f(this.uniforms.time, (performance.now() - this.startTime) / 1000)
    if (this.uniforms.mouse) gl.uniform2f(this.uniforms.mouse, this.mouse[0] * this.dpr, this.mouse[1] * this.dpr)
    gl.clearColor(0, 0, 0, 1)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  dispose() {
    this.stop()
    const gl = this.gl
    if (this.program) gl.deleteProgram(this.program)
    gl.deleteVertexArray(this.vao)
  }
}

function compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | string {
  const shader = gl.createShader(type)
  if (!shader) return 'Failed to create shader'
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) ?? 'Unknown compile error'
    gl.deleteShader(shader)
    return log
  }
  return shader
}

// Prefix each error line with the offending source line so beginners can see
// the exact code that broke without counting line numbers.
function formatGLSLError(log: string, source: string): string {
  const sourceLines = source.split('\n')
  const lines = log.split('\n').filter(Boolean)
  return lines
    .map((line) => {
      const match = line.match(/^[^:]*:\s*\d+:(\d+):/)
      if (!match) return line
      const lineNo = Number(match[1])
      const offending = sourceLines[lineNo - 1]
      return `${line}\n  > ${offending ?? ''}`
    })
    .join('\n')
}
