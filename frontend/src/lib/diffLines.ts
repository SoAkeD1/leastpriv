import type { PolicyAction } from './api'

export type DiffType = 'ctx' | 'del' | 'add'

export interface DiffLine {
  t: DiffType
  x: string
}

function key(pa: PolicyAction): string {
  return `${pa.action}|${pa.resource}`
}

export function buildLiveDiff(before: PolicyAction[], current: PolicyAction[]): DiffLine[] {
  const beforeKeys = new Set(before.map(key))
  const currentKeys = new Set(current.map(key))
  const kept = before.filter((pa) => currentKeys.has(key(pa)))
  const removed = before.filter((pa) => !currentKeys.has(key(pa)))
  const added = current.filter((pa) => !beforeKeys.has(key(pa)))

  const lines: DiffLine[] = [
    { t: 'ctx', x: '{' },
    { t: 'ctx', x: '  "Effect": "Allow",' },
    { t: 'ctx', x: '  "Action": [' },
  ]
  kept.forEach((pa) => lines.push({ t: 'ctx', x: `    "${pa.action}" on "${pa.resource}",` }))
  removed.forEach((pa) => lines.push({ t: 'del', x: `    "${pa.action}" on "${pa.resource}",` }))
  added.forEach((pa) => lines.push({ t: 'add', x: `    "${pa.action}" on "${pa.resource}",` }))
  lines.push({ t: 'ctx', x: '  ]' }, { t: 'ctx', x: '}' })
  return lines
}

export function diffCounts(before: PolicyAction[], current: PolicyAction[]): { removed: number; added: number } {
  const beforeKeys = new Set(before.map(key))
  const currentKeys = new Set(current.map(key))
  return {
    removed: before.filter((pa) => !currentKeys.has(key(pa))).length,
    added: current.filter((pa) => !beforeKeys.has(key(pa))).length,
  }
}

export function diffStyle(t: DiffType) {
  if (t === 'del') return { fg: 'var(--broken)', bg: 'rgb(var(--broken-rgb) / .08)', sign: '-', deco: 'line-through' as const }
  if (t === 'add') return { fg: 'var(--healthy)', bg: 'rgb(var(--healthy-rgb) / .08)', sign: '+', deco: 'none' as const }
  return { fg: 'var(--muted)', bg: 'transparent', sign: ' ', deco: 'none' as const }
}
