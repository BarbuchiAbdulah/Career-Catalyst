import type { Student } from './types'
import { seedStudents } from './seed'

const STORAGE_KEY = 'career-catalyst:students'

export function loadStudents(): Student[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seedStudents
    return JSON.parse(raw) as Student[]
  } catch {
    return seedStudents
  }
}

export function saveStudents(students: Student[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(students))
}

export function resetStudents(): Student[] {
  localStorage.removeItem(STORAGE_KEY)
  return seedStudents
}
