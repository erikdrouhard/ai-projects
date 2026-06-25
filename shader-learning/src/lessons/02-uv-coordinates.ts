import type { Lesson } from './types'

export const lesson02: Lesson = {
  slug: 'uv-coordinates',
  title: 'UV coordinates and gradients',
  summary:
    'Each pixel needs to know "where am I?". That answer is the UV coordinate — your most important tool.',
  sections: [
    {
      heading: 'Where am I?',
      body: [
        'A single pixel can\'t be very interesting if it doesn\'t know where it is. Every shader gives you the pixel\'s position on the canvas. We normalize that position to the <strong>UV coordinate</strong>: a <code>vec2</code> where <code>(0,0)</code> is the bottom-left corner and <code>(1,1)</code> is the top-right.',
        'In our setup the variable <code>v_uv</code> is already that UV. You\'ll use it constantly. Most shader art is "do math on the UV and turn that into a color".',
      ],
    },
    {
      heading: 'A gradient from UV',
      body: [
        'The simplest thing we can do: feed the UV directly into the color. <code>v_uv.x</code> goes from 0 on the left to 1 on the right, so using it as the red channel gives a horizontal red gradient. Using <code>v_uv.y</code> as green gives a vertical green gradient. Use both together and you get this:',
      ],
      code: `outColor = vec4(v_uv.x, v_uv.y, 0.0, 1.0);`,
    },
    {
      heading: 'Swizzling',
      body: [
        'GLSL has a neat shorthand called <em>swizzling</em>. You can pluck any combination of <code>.x .y .z .w</code> (or <code>.r .g .b .a</code>) out of a vector. So <code>v_uv.yx</code> is the UV with x and y flipped, and <code>vec4(v_uv, 0.0, 1.0)</code> means "use the UV as the first two values, then 0, then 1".',
        'Try editing the starter to see how the gradient changes.',
      ],
    },
  ],
  starter: `// v_uv is a vec2: x goes 0->1 left to right, y goes 0->1 bottom to top.
// Use it as a color. Each component is already between 0 and 1, perfect.

void main() {
  vec3 color = vec3(v_uv.x, v_uv.y, 0.0);
  outColor = vec4(color, 1.0);
}
`,
  solution: `// Diagonal rainbow using the UV in three different ways.
void main() {
  vec3 color = vec3(
    v_uv.x,
    v_uv.y,
    1.0 - v_uv.x
  );
  outColor = vec4(color, 1.0);
}
`,
  challenges: [
    'Swap x and y so the gradient runs the other way.',
    'Make the canvas brighter in the center and darker at the corners. Hint: the distance from the center is <code>length(v_uv - 0.5)</code>.',
    'Animate the colors over time. <code>u_time</code> is a float (in seconds). Try <code>sin(u_time)</code> as a color component — but remember sin returns -1..1, so map it: <code>sin(u_time) * 0.5 + 0.5</code>.',
  ],
}
