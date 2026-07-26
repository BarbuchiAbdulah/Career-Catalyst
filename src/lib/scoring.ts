import type { Entry, Band } from './types'

// TODO: implement the real CATS config and WEIGHT per CLAUDE.md.
// scoreFor() is meant to be the SINGLE source of truth for readiness —
// both StudentView and StaffView must call this, never compute their own.

export function scoreFor(_entries: Entry[]): number {
  // TODO: implement
  return 0
}

export function band(_score: number): Band {
  // TODO: implement
  return 'low'
}
