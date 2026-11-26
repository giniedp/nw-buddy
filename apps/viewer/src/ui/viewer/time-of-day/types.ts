export interface TimeOfDayButtonState {
  /**
   * The slider is open
   */
  open: boolean
  /**
   * The hour of the day, with fraction
   */
  readonly time: number
}
