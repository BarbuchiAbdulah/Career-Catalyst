import type { Readiness } from '../lib/types'

// TODO: implement the real dial + category bars per CLAUDE.md's design system
// (this is the app's signature element — spend visual boldness here).

export function Dial({ readiness }: { readiness: Readiness }) {
  return <div className="dial">Score: {readiness.score}</div>
}

export function CatBars({ readiness: _readiness }: { readiness: Readiness }) {
  return <div className="cat-bars">{/* TODO: per-category breakdown bars */}</div>
}
