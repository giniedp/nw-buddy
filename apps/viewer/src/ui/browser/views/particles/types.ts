/**
 * The emitters and particles of the shown effect, polled from the engine
 */
export interface ParticleStats {
  state: string
  emitters: number
  particles: number
}

export interface ParticleModeState {
  /**
   * The library could not be read
   */
  readonly loadError: string | null
  /**
   * The library is read
   */
  readonly ready: boolean
  filter: string
  /**
   * The full name of the shown effect, null until the library is read
   */
  selected: string | null
  stats: ParticleStats | null
  /**
   * The effects that match the filter of all of them, e.g. `3 of 12 effects`
   */
  readonly count: string
  /**
   * The shown effect with its stats, as one line
   */
  readonly info: string
}
