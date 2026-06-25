import { Link } from 'react-router-dom'
import { lessons } from '../lessons'

export default function HomePage() {
  const first = lessons[0]
  return (
    <div className="home">
      <header className="home-hero">
        <div className="home-eyebrow">Interactive GLSL tutorial</div>
        <h1>Learn shaders by playing with them.</h1>
        <p>
          Shaders are tiny programs that paint every pixel on the screen, in parallel, on
          your GPU. They look intimidating because they use a different language and
          think in terms of math — but the ideas underneath are simple, and the feedback
          loop is instant. This course starts at zero and builds up one small idea at a
          time, with a live editor and preview on every page.
        </p>
        {first && (
          <Link to={`/lesson/${first.slug}`} className="btn primary">
            Start with Lesson 01: {first.title} →
          </Link>
        )}
      </header>

      <section className="home-section">
        <h2>What you'll learn</h2>
        <ul className="bullets">
          <li>What a shader actually is, and why it runs on the GPU.</li>
          <li>How to think in <code>vec2</code>, <code>vec3</code>, <code>vec4</code> and UV coordinates.</li>
          <li>Drawing shapes with math — circles, squares, gradients, patterns.</li>
          <li>Animating with time and smooth transitions.</li>
          <li>Noise, randomness, and procedural textures.</li>
        </ul>
      </section>

      <section className="home-section">
        <h2>Curriculum</h2>
        <ol className="curriculum">
          {lessons.map((lesson) => (
            <li key={lesson.slug}>
              <Link to={`/lesson/${lesson.slug}`}>
                <strong>{lesson.title}</strong>
                <span>{lesson.summary}</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="home-section">
        <h2>How to use this site</h2>
        <p>
          Every lesson has an editable code panel on the left and a live preview on the
          right. Change a number, save (it auto-runs), and watch what happens. Don't
          worry about breaking it — there's a <em>Reset</em> button on every lesson, and
          most have a <em>Show solution</em> button if you get stuck.
        </p>
      </section>
    </div>
  )
}
