import { NavLink, Navigate, Route, Routes, useParams } from 'react-router-dom'
import { lessons } from './lessons'
import LessonView from './components/LessonView'
import HomePage from './components/HomePage'

function LessonRoute() {
  const { slug } = useParams<{ slug: string }>()
  const lesson = lessons.find((l) => l.slug === slug)
  if (!lesson) return <Navigate to="/" replace />
  return <LessonView lesson={lesson} />
}

export default function App() {
  return (
    <div className="app">
      <aside className="sidebar">
        <NavLink to="/" className="brand" end>
          <span className="brand-mark">▦</span>
          <span>Shader School</span>
        </NavLink>
        <nav className="lesson-nav">
          <div className="nav-section">Lessons</div>
          {lessons.map((lesson, i) => (
            <NavLink
              key={lesson.slug}
              to={`/lesson/${lesson.slug}`}
              className={({ isActive }) => `lesson-link${isActive ? ' active' : ''}`}
            >
              <span className="lesson-num">{String(i + 1).padStart(2, '0')}</span>
              <span className="lesson-title">{lesson.title}</span>
            </NavLink>
          ))}
        </nav>
        <footer className="sidebar-footer">
          <a href="https://thebookofshaders.com/" target="_blank" rel="noreferrer">
            The Book of Shaders ↗
          </a>
          <a href="https://www.shadertoy.com/" target="_blank" rel="noreferrer">
            Shadertoy ↗
          </a>
        </footer>
      </aside>
      <main className="content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/lesson/:slug" element={<LessonRoute />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
