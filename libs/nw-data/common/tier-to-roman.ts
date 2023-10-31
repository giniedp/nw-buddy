const ROMAN_UNICODE = {
  1: 'Ⅰ',
  2: 'Ⅱ',
  3: 'Ⅲ',
  4: 'Ⅳ',
  5: 'Ⅴ',
}
const ROMAN = {
  1: 'I',
  2: 'II',
  3: 'III',
  4: 'IV',
  5: 'V',
}
export function getItemTierAsRoman(tier: number, unicode = false): string {
  return (unicode ? ROMAN_UNICODE : ROMAN)[tier] || ''
}
