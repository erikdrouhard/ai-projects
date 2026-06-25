import type { Lesson } from './types'

export const lesson03: Lesson = {
  slug: 'shaping-functions',
  title: 'Shaping functions: step, smoothstep, mix',
  summary:
    'The three functions you\'ll use forever: hard edges with step, soft edges with smoothstep, and blending with mix.',
  sections: [
    {
      heading: 'Turning gradients into shapes',
      body: [
        'Last lesson you saw a smooth gradient from 0 to 1. To draw a <em>shape</em>, we need a way to say "this pixel is inside, this one is outside" — i.e., turn a smooth value into a hard 0 or 1 (or something in between).',
        'Three built-in functions cover 90% of what you need.',
      ],
    },
    {
      heading: 'step(edge, x)',
      body: [
        '<code>step</code> returns 0 if <code>x</code> is below <code>edge</code>, otherwise 1. It\'s a hard switch — perfect for crisp shapes.',
      ],
      code: `float half = step(0.5, v_uv.x); // 0 on the left half, 1 on the right`,
    },
    {
      heading: 'smoothstep(edge0, edge1, x)',
      body: [
        '<code>smoothstep</code> is the same idea but with a smooth ramp from 0 to 1 between two edges. The transition is a nice S-curve — great for soft edges and anti-aliasing.',
      ],
      code: `float band = smoothstep(0.4, 0.6, v_uv.x); // soft transition`,
    },
    {
      heading: 'mix(a, b, t)',
      body: [
        '<code>mix(a, b, t)</code> is a linear blend: when <code>t</code> is 0 you get <code>a</code>, when it\'s 1 you get <code>b</code>, in between you get a smooth blend. It works on floats <em>and</em> on vectors, so you can blend two colors with the same call.',
      ],
      code: `vec3 color = mix(vec3(0.1, 0.2, 0.6), vec3(1.0, 0.7, 0.3), v_uv.y);`,
    },
    {
      heading: 'Putting them together: a soft circle',
      body: [
        'The starter draws a soft white circle in the middle of the canvas. The key idea: measure each pixel\'s distance from the center, then use <code>smoothstep</code> to make pixels inside the radius bright and pixels outside dark.',
      ],
    },
  ],
  starter: `// A soft circle in the middle.
//
// Step 1: shift UV so (0,0) is the center, not the corner.
// Step 2: measure distance from center.
// Step 3: use smoothstep to fade from "inside" to "outside".

void main() {
  vec2 uv = v_uv - 0.5;
  // Fix the aspect ratio so the circle isn't squished on wide canvases.
  uv.x *= u_resolution.x / u_resolution.y;

  float dist = length(uv);
  float radius = 0.25;
  float softness = 0.02;

  // Inside the radius -> 1, outside -> 0, with a smooth edge.
  float mask = 1.0 - smoothstep(radius, radius + softness, dist);

  vec3 background = vec3(0.05, 0.07, 0.12);
  vec3 fill = vec3(1.0, 0.8, 0.4);
  vec3 color = mix(background, fill, mask);

  outColor = vec4(color, 1.0);
}
`,
  solution: `// A pulsing, soft-edged circle that breathes with time.
void main() {
  vec2 uv = v_uv - 0.5;
  uv.x *= u_resolution.x / u_resolution.y;

  float dist = length(uv);
  float radius = 0.2 + 0.05 * sin(u_time * 2.0);
  float softness = 0.1;

  float mask = 1.0 - smoothstep(radius - softness, radius + softness, dist);

  vec3 background = vec3(0.05, 0.07, 0.12);
  vec3 fill = vec3(1.0, 0.6, 0.3);
  vec3 color = mix(background, fill, mask);

  outColor = vec4(color, 1.0);
}
`,
  challenges: [
    'Replace <code>smoothstep</code> with <code>step</code> and see what changes — hard edges return.',
    'Add a second circle of a different color. Hint: compute a second mask and mix again.',
    'Make the circle pulse with time by replacing <code>radius</code> with something like <code>0.2 + 0.05 * sin(u_time)</code>.',
    'Try drawing a square: instead of <code>length(uv)</code>, use <code>max(abs(uv.x), abs(uv.y))</code>.',
  ],
}
