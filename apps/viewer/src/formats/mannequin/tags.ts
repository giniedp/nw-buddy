/**
 * Splits a Mannequin tag expression (`Tag1+Tag2`, also used for scope and flag lists), empty parts dropped
 */
export function splitTags(text: string | null | undefined): string[] {
  if (!text) {
    return []
  }
  return text
    .split('+')
    .map((it) => it.trim())
    .filter((it) => !!it)
}
