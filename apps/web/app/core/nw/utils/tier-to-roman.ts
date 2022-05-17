const ROMAN = {
  1: 'Ⅰ',
  2: 'Ⅱ',
  3: 'Ⅱ',
  4: 'Ⅲ',
  5: 'Ⅴ',
}

export function getItemTierAsRoman(tier: number) {
  return ROMAN[tier] || String(tier ?? '')
}
