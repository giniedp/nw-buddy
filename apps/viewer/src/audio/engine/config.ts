/**
 * Tuning knobs of the audio engine. What gets loaded is decided by trial and error, so everything here is a list
 * or a budget that can be changed at runtime (debug panel), every block is logged once with its reason.
 */
export interface AudioConfig {
  /**
   * master volume in dB
   */
  masterDb: number
  triggers: {
    /**
     * glob patterns on ATL trigger names, a trigger must match one of them
     */
    allow: string[]
    /**
     * glob patterns on ATL trigger names, wins over allow
     */
    skip: string[]
  }
  banks: {
    /**
     * glob patterns on bank names (without `.bnk`) that are never loaded
     */
    skip: string[]
    /**
     * bank size limit in MB, 0 disables the limit
     */
    maxSizeMB: number
  }
  /**
   * budget of decoded PCM in MB (Float32 on the main thread)
   */
  pcmBudgetMB: number
  /**
   * max number of concurrent point emitters
   */
  maxEmitterVoices: number
  /**
   * global ambience layers, QuadAmb beds played on the listener
   */
  beds: string[]
  /**
   * music triggers played on the listener (MX_Context Territory, MX_Gameplay Ambient)
   */
  music: string[]
  /**
   * music volume in dB, added to the music voices
   */
  musicDb: number
}

export const DEFAULT_AUDIO_CONFIG: AudioConfig = {
  masterDb: 0,
  triggers: {
    allow: [
      'Play_QuadAmb_*',
      'Play_AMB_*',
      'Play_Amb_*',
      'Play_SFX_*_Lp',
      'Play_Corruption_Area_*',
      'Play_MX_Gameplay',
    ],
    skip: ['*NPC*', '*_VO_*', '*Dialogue*', 'Play_FLY_*', 'Play_MXMI_*'],
  },
  banks: {
    skip: ['ui', 'impacts', 'player_mvts', 'ftue', 'npc_*', 'wpn_*', 'charactervo', 'igc_*'],
    maxSizeMB: 16,
  },
  pcmBudgetMB: 384,
  maxEmitterVoices: 24,
  beds: ['Play_AMB_EXT_Grass', 'Play_QuadAmb_Wildlife', 'Play_QuadAmb_Layer'],
  music: ['Play_MX_Gameplay'],
  musicDb: -6,
}

const globCache = new Map<string, RegExp>()

/**
 * Case insensitive glob match, `*` matches any sequence, `?` a single character
 */
export function globMatch(pattern: string, value: string) {
  let re = globCache.get(pattern)
  if (!re) {
    const source = pattern
      .split('')
      .map((c) => (c === '*' ? '.*' : c === '?' ? '.' : c.replace(/[.+^${}()|[\]\\]/g, '\\$&')))
      .join('')
    re = new RegExp(`^${source}$`, 'i')
    globCache.set(pattern, re)
  }
  return re.test(value)
}

export function globAny(patterns: string[], value: string) {
  return patterns.some((p) => globMatch(p, value))
}

/**
 * Whether a trigger passes the allow and skip lists, returns the blocking reason otherwise
 */
export function checkTrigger(config: AudioConfig, trigger: string): string | null {
  if (globAny(config.triggers.skip, trigger)) {
    return 'trigger skip list'
  }
  if (!globAny(config.triggers.allow, trigger)) {
    return 'trigger not in allow list'
  }
  return null
}
