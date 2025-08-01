import { environment } from '../../../environments'
import { assetUrl } from '../../utils'

const BASE_URL = environment.nwCharUrl
const SKIN_OPTION_COUNT = 10
const FACE_OPTION_COUNT = 30
const COLOR_OPTION_COUNT = 30
const HAIR_OPTION_COUNT = 71
const BEARD_OPTION_COUNT = 68

function iconUrl(url: string) {
  return (BASE_URL || '') + url
}

export function characterIconUrls({
  isMale,
  skin,
  face,
  hairColor,
  hairStyle,
  beardColor,
  beardStyle,
}: {
  skin: number
  face: number
  isMale: boolean
  hairColor: number
  hairStyle: number
  beardColor: number
  beardStyle: number
}) {
  const result = {
    face: characterFaceLayerIcon({ isMale, skin, face }),
    hair: null as string,
    beard: null as string,
  }
  if (BASE_URL) {
    result.face = characterFaceLayerIcon({ isMale, skin, face })
    result.hair = characterHairLayerIcon({ style: hairStyle, color: hairColor })
    result.beard = characterBeardLayerIcon({ style: beardStyle, color: beardColor })
  }
  return result
}

export function characterFallbackFaceIcon({ isMale, skin }: { isMale: boolean; skin: number }) {
  const gender = isMale ? 'male' : 'female'
  const file = `/${gender}-face01-skin${String(skin).padStart(2, '0')}.webp`
  return assetUrl(file)
}

export function characterFaceLayerIcon({ isMale, skin, face }: { skin: number; face: number; isMale: boolean }) {
  const gender = isMale ? 'male' : 'female'
  return iconUrl(`/${gender}/${gender}-face${String(face).padStart(2, '0')}-skin${String(skin).padStart(2, '0')}.webp`)
}

export function characterHairLayerIcon({ style, color }: { style: number; color: number }) {
  if (!style) {
    return null
  }
  // hairstyle/male-hairstyle01m-haircolor1
  return iconUrl(`/hairstyle/male-hairstyle${String(style).padStart(2, '0')}m-haircolor${color}.webp`)
}

export function characterBeardLayerIcon({ style, color }: { style: number; color: number }) {
  if (!style) {
    return null
  }
  // facialhair/male-facialhair68m-haircolor30
  return iconUrl(`/facialhair/male-facialhair${String(style).padStart(2, '0')}m-haircolor${color}.webp`)
}

export function characterSkinOptions({ isMale, skin, face }: { isMale: boolean; skin: number; face: number }) {
  return Array.from({ length: SKIN_OPTION_COUNT }).map((_, i) => {
    const value = i + 1
    return {
      value,
      selected: value === skin,
      icon: characterFaceLayerIcon({ isMale, skin: value, face }),
    }
  })
}

export function characterFaceOptions({ isMale, skin, face }: { isMale: boolean; skin: number; face: number }) {
  return Array.from({ length: FACE_OPTION_COUNT }).map((_, i) => {
    const value = i + 1
    return {
      value,
      selected: value === face,
      icon: characterFaceLayerIcon({ isMale, skin, face: value }),
    }
  })
}

export function characterHairStyleOptions({ style, color }: { style: number; color: number }) {
  return Array.from({ length: HAIR_OPTION_COUNT + 1 }).map((_, value) => {
    return {
      value,
      selected: value === style,
      icon: characterHairLayerIcon({ style: value, color }),
    }
  })
}

export function characterHairColorOptions({ style, color }: { style: number; color: number }) {
  if (!style) {
    style = 1
  }
  return Array.from({ length: COLOR_OPTION_COUNT }).map((_, i) => {
    const value = i + 1
    return {
      value,
      selected: value === color,
      icon: characterHairLayerIcon({ style, color: value }),
    }
  })
}

export function characterBeardStyleOptions({ style, color }: { style: number; color: number }) {
  return Array.from({ length: BEARD_OPTION_COUNT + 1 }).map((_, value) => {
    return {
      value,
      selected: value === style,
      icon: characterBeardLayerIcon({ style: value, color }),
    }
  })
}

export function characterBeardColorOptions({ style, color }: { style: number; color: number }) {
  if (!style) {
    style = 1
  }
  return Array.from({ length: COLOR_OPTION_COUNT }).map((_, i) => {
    const value = i + 1
    return {
      value,
      selected: value === color,
      icon: characterBeardLayerIcon({ style, color: value }),
    }
  })
}
