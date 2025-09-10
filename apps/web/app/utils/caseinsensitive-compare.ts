const collator = new Intl.Collator("en", { sensitivity: "base" })
export function eqCaseInsensitive(a: string, b: string) {
  return collator.compare(a, b) === 0
}
