const ROMAN = {
  1: 'Ⅰ',
  2: 'Ⅱ',
  3: 'Ⅲ',
  4: 'Ⅳ',
  5: 'Ⅴ',
}

export function getItemTierAsRoman(tier: number) {
  return ROMAN[tier] || ''
}
