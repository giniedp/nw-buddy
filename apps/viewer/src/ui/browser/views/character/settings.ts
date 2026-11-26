import type { CharacterSettings } from './types'

/**
 * sessionStorage key of the view settings, a convenience: the view works without it
 */
const STORAGE_KEY = 'nw-viewer.browser.character'

/**
 * New default settings every call: the store changes its settings in place
 */
export function defaultSettings(): CharacterSettings {
  return {
    list: 'animations',
    filter: '',
    fragmentFilter: '',
    databases: {},
    speed: 1,
    loop: true,
    skeleton: false,
    hitboxes: false,
    inPlace: true,
    listWidth: null,
  }
}

export function loadSettings(): CharacterSettings {
  try {
    return parseSettings(sessionStorage.getItem(STORAGE_KEY))
  } catch {
    return defaultSettings()
  }
}

export function saveSettings(settings: CharacterSettings) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // storage blocked or full: the settings are not restored, nothing else breaks
  }
}

/**
 * The stored settings over the defaults
 */
export function parseSettings(json: string | null): CharacterSettings {
  const stored = JSON.parse(json ?? 'null')
  if (!stored || typeof stored !== 'object') {
    return defaultSettings()
  }
  const result = { ...defaultSettings(), ...stored }
  if (result.list !== 'animations' && result.list !== 'fragments') {
    result.list = 'fragments'
  }
  if (!(typeof result.listWidth === 'number' && result.listWidth > 0)) {
    result.listWidth = null
  }
  return result
}
