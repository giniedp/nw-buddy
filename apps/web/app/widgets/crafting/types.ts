export type AmountMode = 'net' | 'gross'

export interface AmountDetail {
  net: number
  gross: number
  bonus: number
  bonusPercent: number
}
