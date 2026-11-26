/**
 * Whether two names are equal without regard to ASCII case (fragment, tag, item class names), allocates nothing
 */
export function sameName(a: string, b: string): boolean {
  if (a === b) {
    return true
  }
  if (a.length !== b.length) {
    return false
  }
  for (let i = 0; i < a.length; i++) {
    const x = a.charCodeAt(i)
    const y = b.charCodeAt(i)
    if (x !== y && lowerAscii(x) !== lowerAscii(y)) {
      return false
    }
  }
  return true
}

function lowerAscii(code: number): number {
  if (code >= 65 && code <= 90) {
    return code + 32
  }
  return code
}
