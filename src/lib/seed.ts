import type { Student } from './types'

export function uid(): string {
  return crypto.randomUUID()
}

// TODO: real demo students for local dev / first-run fallback
export const seedStudents: Student[] = []
