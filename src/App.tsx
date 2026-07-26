import { useState } from 'react'
import type { Student } from './lib/types'
import { loadStudents } from './lib/storage'
import { StudentView } from './views/StudentView'
import { StaffView } from './views/StaffView'

type Role = 'student' | 'staff'

export default function App() {
  const [role, setRole] = useState<Role>('student')
  const [students] = useState<Student[]>(() => loadStudents())

  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <header>
        <h1>Career Catalyst</h1>
        <div role="group" aria-label="View as">
          <button aria-pressed={role === 'student'} onClick={() => setRole('student')}>
            Student
          </button>
          <button aria-pressed={role === 'staff'} onClick={() => setRole('staff')}>
            Staff
          </button>
        </div>
      </header>
      <main id="main">
        {role === 'student' ? (
          students[0] ? (
            <StudentView student={students[0]} />
          ) : (
            <p>No students yet — add seed data in src/lib/seed.ts.</p>
          )
        ) : (
          <StaffView students={students} />
        )}
      </main>
    </div>
  )
}
