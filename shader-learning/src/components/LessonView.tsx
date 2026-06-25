import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Lesson } from '../lessons/types'
import { lessons } from '../lessons'
import CodeEditor from './CodeEditor'
import ShaderCanvas from './ShaderCanvas'

type Props = {
  lesson: Lesson
}

export default function LessonView({ lesson }: Props) {
  const [source, setSource] = useState(lesson.starter)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setSource(lesson.starter)
    setError(null)
  }, [lesson])

  const onError = useCallback((next: string | null) => setError(next), [])

  const { prev, next } = useMemo(() => {
    const idx = lessons.findIndex((l) => l.slug === lesson.slug)
    return {
      prev: idx > 0 ? lessons[idx - 1] : null,
      next: idx >= 0 && idx < lessons.length - 1 ? lessons[idx + 1] : null,
    }
  }, [lesson])

  return (
    <div className="lesson">
      <header className="lesson-header">
        <div className="lesson-eyebrow">Lesson {lessonNumber(lesson)}</div>
        <h1>{lesson.title}</h1>
        <p className="lesson-summary">{lesson.summary}</p>
      </header>

      <section className="lesson-body">
        {lesson.sections.map((section, i) => (
          <div key={i} className="lesson-section">
            {section.heading && <h2>{section.heading}</h2>}
            {section.body.map((paragraph, j) => (
              <p key={j} dangerouslySetInnerHTML={{ __html: paragraph }} />
            ))}
            {section.code && (
              <pre className="snippet"><code>{section.code}</code></pre>
            )}
          </div>
        ))}
      </section>

      <section className="playground">
        <div className="playground-header">
          <h2>Try it</h2>
          <div className="playground-actions">
            <button className="btn ghost" onClick={() => setSource(lesson.starter)}>Reset</button>
            {lesson.solution && (
              <button className="btn" onClick={() => setSource(lesson.solution!)}>Show solution</button>
            )}
          </div>
        </div>
        <div className="playground-grid">
          <div className="editor-pane">
            <CodeEditor value={source} onChange={setSource} />
          </div>
          <div className="preview-pane">
            <ShaderCanvas source={source} onError={onError} />
            {error && <pre className="shader-error">{error}</pre>}
          </div>
        </div>
        {lesson.challenges && lesson.challenges.length > 0 && (
          <div className="challenges">
            <h3>Challenges</h3>
            <ol>
              {lesson.challenges.map((challenge, i) => (
                <li key={i}>{challenge}</li>
              ))}
            </ol>
          </div>
        )}
      </section>

      <nav className="lesson-pager">
        {prev ? (
          <Link to={`/lesson/${prev.slug}`} className="pager-link prev">
            <span className="pager-label">← Previous</span>
            <span className="pager-title">{prev.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link to={`/lesson/${next.slug}`} className="pager-link next">
            <span className="pager-label">Next →</span>
            <span className="pager-title">{next.title}</span>
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  )
}

function lessonNumber(lesson: Lesson): string {
  const idx = lessons.findIndex((l) => l.slug === lesson.slug)
  return String(idx + 1).padStart(2, '0')
}
