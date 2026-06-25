export type LessonSection = {
  heading?: string
  body: string[]
  code?: string
}

export type Lesson = {
  slug: string
  title: string
  summary: string
  sections: LessonSection[]
  starter: string
  solution?: string
  challenges?: string[]
}
