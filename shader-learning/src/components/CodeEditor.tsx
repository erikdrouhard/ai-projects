import Editor, { type OnMount } from '@monaco-editor/react'
import { useCallback } from 'react'

type Props = {
  value: string
  onChange: (next: string) => void
}

export default function CodeEditor({ value, onChange }: Props) {
  const handleChange = useCallback(
    (next: string | undefined) => onChange(next ?? ''),
    [onChange],
  )

  const handleMount: OnMount = (_editor, monaco) => {
    // Register a minimal GLSL syntax highlighter so beginners get color cues
    // even though Monaco doesn't ship one out of the box.
    if (!monaco.languages.getLanguages().some((l: { id: string }) => l.id === 'glsl')) {
      monaco.languages.register({ id: 'glsl' })
      monaco.languages.setMonarchTokensProvider('glsl', {
        keywords: [
          'attribute', 'const', 'uniform', 'varying', 'break', 'continue',
          'do', 'for', 'while', 'if', 'else', 'in', 'out', 'inout',
          'float', 'int', 'void', 'bool', 'true', 'false', 'return',
          'discard', 'struct', 'precision', 'highp', 'mediump', 'lowp',
          'layout', 'flat', 'smooth',
        ],
        typeKeywords: [
          'vec2', 'vec3', 'vec4', 'ivec2', 'ivec3', 'ivec4',
          'mat2', 'mat3', 'mat4', 'sampler2D', 'samplerCube',
        ],
        builtins: [
          'gl_FragCoord', 'gl_Position', 'gl_PointSize', 'gl_VertexID',
          'sin', 'cos', 'tan', 'atan', 'abs', 'floor', 'fract', 'mod',
          'min', 'max', 'clamp', 'mix', 'step', 'smoothstep',
          'length', 'distance', 'dot', 'cross', 'normalize', 'reflect',
          'pow', 'exp', 'log', 'sqrt', 'inversesqrt',
        ],
        operators: [
          '=', '>', '<', '!', '~', '?', ':', '==', '<=', '>=', '!=',
          '&&', '||', '++', '--', '+', '-', '*', '/', '&', '|', '^', '%',
          '<<', '>>', '+=', '-=', '*=', '/=', '%=',
        ],
        symbols: /[=><!~?:&|+\-*/^%]+/,
        tokenizer: {
          root: [
            [/#[a-z]+/, 'keyword.directive'],
            [/[a-zA-Z_]\w*/, {
              cases: {
                '@keywords': 'keyword',
                '@typeKeywords': 'type',
                '@builtins': 'predefined',
                '@default': 'identifier',
              },
            }],
            { include: '@whitespace' },
            [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
            [/\d+/, 'number'],
            [/[;,.]/, 'delimiter'],
            [/@symbols/, {
              cases: {
                '@operators': 'operator',
                '@default': '',
              },
            }],
            [/"([^"\\]|\\.)*$/, 'string.invalid'],
            [/"/, 'string', '@string'],
          ],
          whitespace: [
            [/[ \t\r\n]+/, ''],
            [/\/\*/, 'comment', '@comment'],
            [/\/\/.*$/, 'comment'],
          ],
          comment: [
            [/[^/*]+/, 'comment'],
            [/\*\//, 'comment', '@pop'],
            [/[/*]/, 'comment'],
          ],
          string: [
            [/[^\\"]+/, 'string'],
            [/"/, 'string', '@pop'],
          ],
        },
      })
    }
  }

  return (
    <Editor
      value={value}
      language="glsl"
      theme="vs-dark"
      onChange={handleChange}
      onMount={handleMount}
      options={{
        fontSize: 13,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        tabSize: 2,
        automaticLayout: true,
        renderLineHighlight: 'gutter',
      }}
    />
  )
}
