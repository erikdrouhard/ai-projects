import { useEffect, useRef, useState } from 'react'
import { ShaderRenderer } from '../lib/shaderRenderer'

type Props = {
  source: string
  onError?: (error: string | null) => void
}

export default function ShaderCanvas({ source, onError }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rendererRef = useRef<ShaderRenderer | null>(null)
  const [fatal, setFatal] = useState<string | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    try {
      const renderer = new ShaderRenderer(canvas)
      rendererRef.current = renderer
      renderer.start()
      const handleMouse = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect()
        renderer.setMouse(e.clientX - rect.left, rect.height - (e.clientY - rect.top))
      }
      canvas.addEventListener('mousemove', handleMouse)
      return () => {
        canvas.removeEventListener('mousemove', handleMouse)
        renderer.dispose()
        rendererRef.current = null
      }
    } catch (err) {
      setFatal(err instanceof Error ? err.message : String(err))
    }
  }, [])

  useEffect(() => {
    const renderer = rendererRef.current
    if (!renderer) return
    const result = renderer.setFragmentShader(source)
    if (result.ok) {
      renderer.resetTime()
      onError?.(null)
    } else {
      onError?.(result.error)
    }
  }, [source, onError])

  if (fatal) {
    return (
      <div className="canvas-fatal">
        <strong>Can't run shaders here:</strong>
        <p>{fatal}</p>
        <p>Try a recent Chrome, Firefox, or Safari.</p>
      </div>
    )
  }

  return <canvas ref={canvasRef} className="shader-canvas" />
}
