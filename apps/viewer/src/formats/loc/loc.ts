export interface LocString {
  key: string
  value: string
}

/**
 * The strings of a localization file (`<resources><string key="…">value</string>…`)
 */
export function parseLocXml(text: string): LocString[] {
  const doc = new DOMParser().parseFromString(text, 'application/xml')
  if (doc.querySelector('parsererror')) {
    throw new Error('not valid xml')
  }
  return [...doc.getElementsByTagName('string')].map((el) => ({
    key: el.getAttribute('key') ?? '',
    value: el.textContent ?? '',
  }))
}
