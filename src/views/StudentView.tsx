import type { Student } from '../lib/types'

// TODO: student dashboard — log form, entry list, readiness dial (see components/Readiness.tsx)

export function StudentView({ student }: { student: Student }) {
  return (
    <section aria-labelledby="student-view-heading">
      <h2 id="student-view-heading">{student.name}</h2>
      <p>{/* TODO: readiness dial + entry list + log form */}</p>
    </section>
  )
}
