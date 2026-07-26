import type { Student } from '../lib/types'

// TODO: roster table (semantic <table>, <caption>, scope="col", aria-sort)
// + StaffDrill individual student detail. See CLAUDE.md accessibility section.

export function StaffView({ students }: { students: Student[] }) {
  return (
    <section aria-labelledby="staff-view-heading">
      <h2 id="staff-view-heading">Roster</h2>
      <table>
        <caption>Students sorted by readiness score</caption>
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Readiness</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.id}>
              <td>{student.name}</td>
              <td>{/* TODO: readiness score */}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
