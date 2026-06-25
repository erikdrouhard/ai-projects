import type { Lesson } from './types'

export const lesson01: Lesson = {
  slug: 'what-is-a-shader',
  title: 'What is a shader?',
  summary:
    'Understand what a shader does, why it runs on the GPU, and write your very first one — a solid color.',
  sections: [
    {
      heading: 'A shader is a function that runs once per pixel',
      body: [
        'Your screen is a grid of pixels. A <em>fragment shader</em> is a small program the GPU runs <strong>once for every pixel</strong>, in massive parallel, to decide what color that pixel should be.',
        'You don\'t write a loop. You write the recipe for <em>one</em> pixel, and the GPU runs millions of copies of it at once. That parallelism is what makes shaders fast — and what makes them feel weird at first. You can\'t say "draw a line from A to B". You can only say "given my position on the screen, what color am I?"',
      ],
    },
    {
      heading: 'GLSL: the language',
      body: [
        'The language we\'ll use is <code>GLSL</code> (OpenGL Shading Language). It looks like C: it has <code>float</code>, <code>int</code>, <code>if</code>, <code>for</code>, functions, etc. But it has special vector types — <code>vec2</code>, <code>vec3</code>, <code>vec4</code> — that hold 2, 3, or 4 floats together. Colors are <code>vec4</code> = (red, green, blue, alpha), each from 0.0 to 1.0.',
        'Every fragment shader must, at the end, write a color to the output variable. In our setup that variable is called <code>outColor</code>.',
      ],
      code: `outColor = vec4(1.0, 0.0, 0.0, 1.0); // pure red`,
    },
    {
      heading: 'Your first shader',
      body: [
        'The editor on the right has the simplest possible fragment shader. We give every pixel the same color, so the canvas fills with that color. Try editing the three numbers in the <code>vec4(...)</code> call below and watch what happens.',
        'Remember: each number is from 0.0 (none) to 1.0 (full). The fourth is alpha — keep it at 1.0 for now.',
      ],
    },
  ],
  starter: `// A fragment shader: runs once per pixel.
// outColor is what this pixel will be on screen.
// Order is: red, green, blue, alpha. Each from 0.0 to 1.0.

void main() {
  outColor = vec4(0.2, 0.6, 1.0, 1.0);
}
`,
  solution: `// A pleasant teal.
void main() {
  outColor = vec4(0.0, 0.8, 0.7, 1.0);
}
`,
  challenges: [
    'Make the whole canvas pure white. Then pure black.',
    'Find the values for a warm orange (hint: lots of red, some green, almost no blue).',
    'What happens if you put a number bigger than 1.0? Or negative? Try it.',
  ],
}
