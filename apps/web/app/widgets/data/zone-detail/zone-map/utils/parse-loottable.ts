export type ParsedLootTable = ReturnType<typeof parseLootTableID>
export function parseLootTableID(value: string) {
  const original = value || 'Empty'
  const normalized = original
    .split(/[_]/)
    .filter((it) => it.length > 0)
    .map((it) => it[0].toUpperCase() + it.substring(1))
    .join('')

  const tokenized = normalized.split(/(PvP|PvE)|(?<![A-Z])(?=[A-Z])/)
  return {
    original,
    normalized,
    tokenized,
  }
}
