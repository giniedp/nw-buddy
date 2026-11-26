import { environment } from 'apps/web/environments'

/**
 * The models root (`nwbt models`): the player models, bare skins and clips at their game paths, the textures they link
 * resolve against it
 */
export const CHARACTER_MODELS_URL = `${environment.modelsUrl}/`

export type CharacterGender = 'male' | 'female'

/**
 * The stage of the character editor, the character creation ship
 */
export function characterStageUrl(): string {
  return absoluteUrl(`${environment.nwCharUrl}/stage.glb`)
}

/**
 * The player model of a gender
 */
export function characterPlayerUrl(gender: CharacterGender): string {
  return absoluteUrl(`${CHARACTER_MODELS_URL}objects/characters/player/${gender}/player_${gender}.cdf.glb`)
}

/**
 * The model of a bare skin file (an appearance row's `Skin2`)
 */
export function characterSkinUrl(file: string): string {
  return absoluteUrl(`${CHARACTER_MODELS_URL}${file.toLowerCase()}.glb`)
}

/**
 * The model of a clip file (`.caf`, see `ScannedEmote`)
 */
export function characterAnimationUrl(file: string): string {
  return absoluteUrl(`${CHARACTER_MODELS_URL}${file}.glb`)
}

/**
 * Absolute, the viewer resolves the stage's probe cubes against the stage's url
 */
export function absoluteUrl(url: string): string {
  return new URL(url, document.baseURI).href
}
