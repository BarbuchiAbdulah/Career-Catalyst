// Shared types for the whole app. Shapes below are placeholders just
// enough to compile — fill in the real fields as scoring.ts and the
// views take shape.

export type EntryType = 'skill' | 'experience' | 'contact' // TODO: confirm/expand

export interface Entry {
  id: string
  type: EntryType
  title: string
  // TODO: fill in real shape (dates, notes, tags, etc. per entry type)
}

export interface Student {
  id: string
  name: string
  entries: Entry[]
  // TODO: fill in real shape
}

export type Band = 'low' | 'medium' | 'high' // TODO: confirm real bands from CLAUDE.md's scoring spec

export interface Readiness {
  score: number
  band: Band
  // TODO: fill in real shape (per-category breakdown, biggest gap, etc.)
}
