import { computed } from '@angular/core'
import { patchState, signalMethod, signalStore, withComputed, withMethods, withState } from '@ngrx/signals'
import { CharacterRecord } from '../../data'
import {
  characterBeardColorOptions,
  characterBeardStyleOptions,
  characterFaceOptions,
  characterHairColorOptions,
  characterHairStyleOptions,
  characterIconUrls,
  characterSkinOptions,
} from './utils'

export interface CharacterAvatarState {
  gender: CharacterRecord['gender']
  faction: CharacterRecord['faction']
  skin: number
  face: number
  hairStyle: number
  hairColor: number
  beardStyle: number
  beardColor: number
}

export type CharacterAvatarStore = InstanceType<typeof CharacterAvatarStore>
export const CharacterAvatarStore = signalStore(
  withState<CharacterAvatarState>({
    gender: null,
    faction: null,
    skin: 1,
    face: 1,
    hairStyle: 0,
    hairColor: 1,
    beardStyle: 0,
    beardColor: 1,
  }),
  withComputed(({ gender, skin, face, hairStyle, hairColor, beardStyle, beardColor }) => {
    const isMale = computed(() => !gender() || gender() === 'male')
    const icon = computed(() => {
      return characterIconUrls({
        isMale: isMale(),
        face: face(),
        skin: skin(),
        beardColor: beardColor(),
        beardStyle: beardStyle(),
        hairColor: hairColor(),
        hairStyle: hairStyle(),
      })
    })
    return {
      icon,
      skinOptions: computed(() => characterSkinOptions({ isMale: isMale(), skin: skin(), face: face() })),
      faceOptions: computed(() => characterFaceOptions({ isMale: isMale(), skin: skin(), face: face() })),
      hairStyleOptions: computed(() => {
        return characterHairStyleOptions({ style: hairStyle(), color: hairColor() })
      }),
      hairColorOptions: computed(() => {
        return characterHairColorOptions({ style: hairStyle(), color: hairColor() })
      }),
      beardStyleOptions: computed(() => {
        return characterBeardStyleOptions({ style: beardStyle(), color: beardColor() })
      }),
      beardColorOptions: computed(() => {
        return characterBeardColorOptions({ style: beardStyle(), color: beardColor() })
      }),
    }
  }),
  withMethods((store) => {
    return {
      connectCharacter: signalMethod<CharacterRecord>((record) => {
        patchState(store, {
          gender: record?.gender,
          faction: record?.faction,
          face: Number(record?.face) || 1,
          skin: Number(record?.skin) || 1,
          hairColor: Number(record?.hairColor) || 1,
          hairStyle: Number(record?.hairStyle) || 0,
          beardColor: Number(record?.beardColor) || 1,
          beardStyle: Number(record?.beardStyle) || 0,
        })
      }),
    }
  }),
)
