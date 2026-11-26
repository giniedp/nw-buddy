import { computed, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals'
import type { CharacterClip } from '@nw-buddy/viewer'
import type { ArmorAppearanceDefinitions, DyeColorData, WeaponAppearanceDefinitions } from '@nw-data/generated'
import { from } from 'rxjs'
import { injectNwData } from '~/data'
import type { TransmogSlot, TransmogSlotId, TransmogWeapons } from '~/data/transmogs'
import {
  absoluteUrl,
  characterAnimationUrl,
  CHARACTER_LIGHT_STOPS_DEFAULT,
  CHARACTER_MODELS_URL,
  CharacterDyes,
  CharacterGender,
  characterPlayerUrl,
  characterSkinUrl,
  CharacterSlotModel,
  CharacterSlots,
  characterStageUrl,
} from '~/widgets/character-view'
import { TransmogItem, TransmogService } from '~/widgets/data/transmog'
import { getModelUrl } from '~/widgets/model-viewer/utils/get-model-url'
import { itemAppearanceModelUri, weaponAppearanceModelUri } from '~/widgets/model-viewer/utils/get-model-uri'
import type { ModelSource } from '~/widgets/model-viewer/utils/model-source'
import {
  equipTypesByClass,
  WEAPON_SLOTS,
  weaponEquipType,
  WeaponPlacement,
  weaponSockets,
  WeaponSlotId,
} from './weapon-rule'
import {
  applyBodyParts,
  BodyPartFlags,
  bodyParts,
  EQUIP_SLOTS,
  equipCharacter,
  EquipInput,
  EquipUrls,
} from './equip-rule'

/**
 * The id of the player's idle in the emotes metadata
 */
const IDLE_ID = 'Idle'

export type DyeChannel = 'dyeR' | 'dyeG' | 'dyeB' | 'dyeA'

export interface CharacterEditorState {
  gender: CharacterGender
  /**
   * Per slot the transmog item, the dye color indices and the hide flags, as `TransmogRecord.slots`
   */
  slots: Record<TransmogSlotId, TransmogSlot>
  /**
   * Shows the dye channels in plain colors instead of the dyes
   */
  debug: boolean
  /**
   * Exposure in stops from the stage's exposure
   */
  exposureStops: number
  /**
   * Light of the stage's character lights in stops from the game's light
   */
  characterLightStops: number
  /**
   * Light of the stage's background lights in stops from the editor's default
   */
  backgroundLightStops: number
  /**
   * The parts the loaded character file hides by default (the view reports them)
   */
  defaultHiddenParts: string[]
  /**
   * The weapon appearance (`WeaponAppearanceID`) per weapon slot
   */
  weapons: Record<WeaponSlotId, string | null>
  /**
   * Weapon 1 and the shield in the hands, else sheathed (view state, not saved)
   */
  weaponsDrawn: boolean
  /**
   * Counts the user's edits of the {@link CharacterEditorValue}, loads don't count
   */
  revision: number
  /**
   * The playing emote (`EmoteData.UniqueTagID`), null plays the idle
   */
  emote: string | null
  animationPaused: boolean
  /**
   * The last seek request of the user, see the view's `animationSeek`
   */
  animationSeek: { time: number } | null
  /**
   * Time and duration of the animation as the view reports them
   */
  animationProgress: { time: number; duration: number }
}

/**
 * The editor's value as the transmog records store it (`TransmogRecord.gender`, `.slots` and `.emote`)
 */
export interface CharacterEditorValue extends Partial<Record<TransmogSlotId, TransmogSlot>> {
  gender: CharacterGender
  emote?: string | null
  weapons?: TransmogWeapons | null
}

/**
 * The transmog categories of the weapon pickers
 */
export const WEAPON_CATEGORIES = ['1handed', '2handed', 'rangedweapons', 'magical']
export const SHIELD_CATEGORIES = ['shields']

const NO_WEAPONS: Record<WeaponSlotId, string | null> = { weapon1: null, weapon2: null, weapon3: null }

/**
 * A worn model of an export, see `CharacterEditorStore.exportParts`
 */
export interface ExportPart {
  /**
   * The attachment the model binds to, its node name
   */
  name: string
  skin: string
  material: string
  clothFrom: string | null
  /**
   * The model as the view shows it, for its material params
   */
  model: CharacterSlotModel
}

/**
 * A weapon as the view shows it and its game file
 */
interface WeaponModel extends CharacterSlotModel {
  source: ModelSource
}

/**
 * The body material of a gender: the player's bare skins bind it (player .cdf)
 */
function characterBodyMaterial(gender: CharacterGender): string {
  return `objects/characters/player/${gender}/naked_shared/${gender}_naked_body_shared_d2_matgroup.mtl`
}

/**
 * The dyes of a slot: the color rows and the channels the appearance doesn't dye
 */
export interface SlotDyes {
  r: DyeColorData | null
  g: DyeColorData | null
  b: DyeColorData | null
  a: DyeColorData | null
  rDisabled: boolean
  gDisabled: boolean
  bDisabled: boolean
  aDisabled: boolean
}

const EMPTY_SLOT: TransmogSlot = { item: null, dyeR: null, dyeG: null, dyeB: null, dyeA: null, flag: 0 }

/**
 * Plain colors per dye channel, see {@link CharacterEditorState.debug}
 */
const DEBUG_DYES: CharacterDyes = {
  r: { Color: '#FF0000', ColorAmount: 1, ColorOverride: 1 },
  g: { Color: '#00FF00', ColorAmount: 1, ColorOverride: 1 },
  b: { Color: '#0000FF', ColorAmount: 1, ColorOverride: 1 },
  a: { SpecColor: '#FF00FF', SpecAmount: 1 },
}

/**
 * The model urls of the rule: armor from the CDN, bare skins from the character assets
 */
const EQUIP_URLS: EquipUrls = {
  armor: (row) => {
    const uri = itemAppearanceModelUri(row, 'Skin1')
    if (!uri) {
      return null
    }
    // the armor models resolve their textures against the models root
    const { rootUrl, modelUrl } = getModelUrl(uri)
    return { url: absoluteUrl(rootUrl + modelUrl), rootUrl: absoluteUrl(rootUrl) }
  },
  skin: (file) => ({ url: characterSkinUrl(file), rootUrl: absoluteUrl(CHARACTER_MODELS_URL) }),
}

/**
 * The state of the character editor and what the character view shows for it
 */
export const CharacterEditorStore = signalStore(
  withState<CharacterEditorState>({
    gender: 'male',
    slots: {
      head: EMPTY_SLOT,
      chest: EMPTY_SLOT,
      hands: EMPTY_SLOT,
      legs: EMPTY_SLOT,
      feet: EMPTY_SLOT,
    },
    debug: false,
    exposureStops: 0,
    characterLightStops: CHARACTER_LIGHT_STOPS_DEFAULT,
    backgroundLightStops: CHARACTER_LIGHT_STOPS_DEFAULT,
    defaultHiddenParts: [],
    weapons: NO_WEAPONS,
    weaponsDrawn: false,
    revision: 0,
    emote: null,
    animationPaused: false,
    animationSeek: null,
    animationProgress: { time: 0, duration: 0 },
  }),
  withComputed(() => {
    const db = injectNwData()
    const transmogs = inject(TransmogService)
    return {
      transmogMap: toSignal(transmogs.transmogItemsMap$, { initialValue: new Map<string, TransmogItem>() }),
      appearanceMap: toSignal(from(db.armorAppearancesByIdMap())),
      dyeColorMap: toSignal(from(db.dyeColorsByIndexMap())),
      emoteMap: toSignal(from(db.emotesByIdMap())),
      emoteClipsMap: toSignal(from(db.emotesMetadataByIdMap())),
      equipTypeMap: toSignal(from(db.equipTypesMetadataByIdMap())),
      weaponAppearanceMap: toSignal(from(db.weaponAppearancesByIdMap())),
      weaponItemMap: toSignal(from(db.weaponItemsByIdMap())),
    }
  }),
  withComputed(({ gender, weapons, weaponsDrawn, transmogMap, weaponAppearanceMap, weaponItemMap, equipTypeMap }) => {
    /**
     * The equip types of the weapons that show an appearance
     */
    const ownEquipTypes = (transmog: TransmogItem | null | undefined): string[] => {
      const types = (transmog?.items ?? []).map((it) => weaponItemMap()?.get(it.ItemStatsRef)?.EquipType)
      return [...new Set(types.filter((it) => !!it))]
    }
    const typesByClass = computed(() => {
      return equipTypesByClass(
        [...transmogMap().values()]
          .filter((it) => WEAPON_CATEGORIES.includes(it.category) || SHIELD_CATEGORIES.includes(it.category))
          .map((it) => ({ weaponClass: it.subcategory, types: ownEquipTypes(it) })),
      )
    })
    /**
     * The appearance row of each weapon slot, the female variant for the female character
     */
    const weaponAppearances = computed(() => {
      const result = {} as Record<WeaponSlotId, WeaponAppearanceDefinitions | null>
      for (const slot of WEAPON_SLOTS) {
        const row = transmogMap().get(weapons()[slot])?.appearance as WeaponAppearanceDefinitions | undefined
        const female = gender() === 'female' && row?.FemaleAppearance
        result[slot] = (female ? weaponAppearanceMap()?.get(row.FemaleAppearance) : null) ?? row ?? null
      }
      return result
    })
    return {
      weaponAppearances,
      /**
       * The weapon models per socket: sheathed, or weapon 1 and the shield in the hands
       */
      viewSockets: computed(() => {
        const placements: Array<WeaponPlacement<WeaponModel>> = []
        for (const slot of WEAPON_SLOTS) {
          const transmog = transmogMap().get(weapons()[slot])
          const row = weaponAppearances()[slot]
          const typeName = weaponEquipType(ownEquipTypes(transmog), transmog?.subcategory, typesByClass())
          const equipType = equipTypeMap()?.get(typeName)
          const uri = row ? weaponAppearanceModelUri(row, 'MeshOverride') : null
          if (!uri || !equipType) {
            continue
          }
          const { rootUrl, modelUrl } = getModelUrl(uri)
          placements.push({
            slot,
            equipType,
            model: {
              url: absoluteUrl(rootUrl + modelUrl),
              rootUrl: absoluteUrl(rootUrl),
              appearance: row,
              dyes: null,
              source: { model: row.MeshOverride },
            },
          })
        }
        return weaponSockets(placements, weaponsDrawn())
      }),
    }
  }),
  withComputed(({ gender, slots, debug, transmogMap, appearanceMap, dyeColorMap, defaultHiddenParts }) => {
    /**
     * The appearance row of each slot's transmog item for the gender (the male one when the gender has none)
     */
    const appearances = computed(() => {
      const result: Partial<Record<TransmogSlotId, ArmorAppearanceDefinitions | null>> = {}
      for (const slot of EQUIP_SLOTS) {
        const transmog = transmogMap().get(slots()[slot].item)
        const id = ((gender() === 'female' ? transmog?.female : transmog?.male) || transmog?.male)?.id
        result[slot] = appearanceMap()?.get(id) ?? null
      }
      return result
    })
    const dyes = computed(() => {
      const result = {} as Record<TransmogSlotId, SlotDyes>
      for (const slot of EQUIP_SLOTS) {
        const state = slots()[slot]
        const appearance = appearances()[slot]
        const color = (index: number) => dyeColorMap()?.get(index) ?? null
        result[slot] = {
          r: color(state.dyeR),
          g: color(state.dyeG),
          b: color(state.dyeB),
          a: color(state.dyeA),
          rDisabled: Number(appearance?.RDyeSlotDisabled) === 1,
          gDisabled: Number(appearance?.GDyeSlotDisabled) === 1,
          bDisabled: Number(appearance?.BDyeSlotDisabled) === 1,
          aDisabled: Number(appearance?.ADyeSlotDisabled) === 1,
        }
      }
      return result
    })
    const rule = computed(() => {
      return equipCharacter(appearances() as EquipInput, EQUIP_URLS, defaultHiddenParts())
    })
    const bodyPartFlags = computed((): BodyPartFlags => {
      const flags: BodyPartFlags = { hide: {}, show: {} }
      for (const slot of EQUIP_SLOTS) {
        flags.hide[slot] = slots()[slot].flag
        flags.show[slot] = slots()[slot].show
      }
      return flags
    })
    const equip = computed(() => applyBodyParts(rule(), bodyPartFlags()))
    return {
      appearances,
      dyes,
      /**
       * The parts the user may hide or show per slot, with what the rule does with them
       */
      bodyParts: computed(() => bodyParts(rule(), bodyPartFlags())),
      stageUrl: computed(() => characterStageUrl()),
      characterUrl: computed(() => characterPlayerUrl(gender())),
      characterRootUrl: computed(() => absoluteUrl(CHARACTER_MODELS_URL)),
      viewSlots: computed((): CharacterSlots => {
        const result: CharacterSlots = {}
        for (const slot of EQUIP_SLOTS) {
          const slotDyes = debug() ? DEBUG_DYES : enabledDyes(dyes()[slot])
          result[slot] = equip().slots[slot].map((it) => {
            return {
              url: it.url,
              rootUrl: it.rootUrl,
              appearance: it.appearance,
              dyes: it.appearance ? slotDyes : null,
            }
          })
        }
        return result
      }),
      hiddenParts: computed(() => equip().hiddenParts),
      /**
       * The worn models for an export: the game files, the attachment they bind to, the appearance and its dyes (not
       * the debug colors)
       */
      exportParts: computed((): ExportPart[] => {
        return EQUIP_SLOTS.flatMap((slot) => {
          return equip().slots[slot].map((it) => {
            return {
              name: it.attachment,
              skin: it.source.skin,
              material: it.source.material ?? characterBodyMaterial(gender()),
              clothFrom: it.source.clothFrom,
              model: { url: it.url, appearance: it.appearance, dyes: it.appearance ? enabledDyes(dyes()[slot]) : null },
            }
          })
        })
      }),
      /**
       * The character file of the gender
       */
      characterFile: computed(() => `objects/characters/player/${gender()}/player_${gender()}.cdf`),
    }
  }),
  withComputed(({ emote, emoteClipsMap, emoteMap }) => {
    const clips = computed(() => {
      const map = emoteClipsMap()
      return (emote() && map?.get(emote())?.clips) || map?.get(IDLE_ID)?.clips || []
    })
    return {
      /**
       * The row of the playing emote, null for the idle
       */
      emoteRow: computed(() => (emote() && emoteMap()?.get(emote())) || null),
      /**
       * The clip sequence of the emote, or the idle
       */
      viewAnimation: computed((): CharacterClip[] => {
        return clips().map((it) => ({ url: characterAnimationUrl(it.file), loop: it.loop }))
      }),
      /**
       * The clips of the playing sequence as game files (`.caf`) for an export, named after the emote
       */
      exportAnimations: computed((): Array<{ name: string; file: string }> => {
        const name = emote() || IDLE_ID
        return clips().map((it, index, list) => {
          return { name: list.length > 1 ? `${name}_${index + 1}` : name, file: it.file }
        })
      }),
    }
  }),
  withMethods((state) => {
    function updateSlot(slot: TransmogSlotId, value: Partial<TransmogSlot>) {
      patchState(state, {
        slots: { ...state.slots(), [slot]: { ...state.slots()[slot], ...value } },
        revision: state.revision() + 1,
      })
    }
    return {
      updateSlot,
      /**
       * Shows a stored value (a record's gender and slots), without counting as an edit. Missing slots are empty, old
       * sets may lack fields of a slot.
       */
      load(value: Partial<CharacterEditorValue> | null) {
        const slots = {} as Record<TransmogSlotId, TransmogSlot>
        for (const slot of EQUIP_SLOTS) {
          slots[slot] = { ...EMPTY_SLOT, ...value?.[slot] }
        }
        patchState(state, {
          gender: value?.gender === 'female' ? 'female' : 'male',
          slots,
          emote: value?.emote || null,
          weapons: {
            weapon1: value?.weapons?.weapon1 || null,
            weapon2: value?.weapons?.weapon2 || null,
            weapon3: value?.weapons?.weapon3 || null,
          },
        })
      },
      /**
       * The value to store (a record's gender, slots, emote and weapons)
       */
      getValue(): CharacterEditorValue {
        return { gender: state.gender(), ...state.slots(), emote: state.emote(), weapons: { ...state.weapons() } }
      },
      setWeapon(slot: WeaponSlotId, id: string | null) {
        patchState(state, { weapons: { ...state.weapons(), [slot]: id }, revision: state.revision() + 1 })
      },
      setWeaponsDrawn(weaponsDrawn: boolean) {
        patchState(state, { weaponsDrawn })
      },
      setGender(gender: CharacterGender) {
        patchState(state, { gender, revision: state.revision() + 1 })
      },
      setItem(slot: TransmogSlotId, item: string | null) {
        updateSlot(slot, { item })
      },
      setDye(slot: TransmogSlotId, channel: DyeChannel, index: number | null) {
        updateSlot(slot, { [channel]: index })
      },
      clearDyes(slot?: TransmogSlotId) {
        for (const it of slot ? [slot] : EQUIP_SLOTS) {
          updateSlot(it, { dyeR: null, dyeG: null, dyeB: null, dyeA: null })
        }
      },
      /**
       * Flips the visibility of a body part: against the rule it sets the slot's `flag` (hide) or `show` bit, back to
       * the rule it clears it
       */
      toggleBodyPart(slot: TransmogSlotId, bit: 1 | 2) {
        const part = state.bodyParts()[slot].find((it) => it.bit === bit)
        if (!part || part.armor) {
          return
        }
        const current = state.slots()[slot]
        const flag = Number(current.flag) || 0
        const show = Number(current.show) || 0
        if (part.hiddenBy) {
          updateSlot(slot, { flag: flag & ~bit, show: show ^ bit })
        } else {
          updateSlot(slot, { flag: flag ^ bit, show: show & ~bit })
        }
      },
      setDebug(debug: boolean) {
        patchState(state, { debug })
      },
      /**
       * Plays an emote from its start, null the idle
       */
      setEmote(emote: string | null) {
        patchState(state, { emote: emote || null, animationPaused: false, revision: state.revision() + 1 })
      },
      setAnimationPaused(animationPaused: boolean) {
        patchState(state, { animationPaused })
      },
      /**
       * Pauses and moves the animation to a time
       */
      seekAnimation(time: number) {
        patchState(state, { animationPaused: true, animationSeek: { time } })
      },
      setAnimationProgress(animationProgress: { time: number; duration: number }) {
        patchState(state, { animationProgress })
      },
      setDefaultHiddenParts(defaultHiddenParts: string[]) {
        patchState(state, { defaultHiddenParts })
      },
      setExposureStops(exposureStops: number) {
        patchState(state, { exposureStops })
      },
      setCharacterLightStops(characterLightStops: number) {
        patchState(state, { characterLightStops })
      },
      setBackgroundLightStops(backgroundLightStops: number) {
        patchState(state, { backgroundLightStops })
      },
    }
  }),
)

/**
 * The dyes the view applies: the set colors of the channels the appearance dyes
 */
function enabledDyes(dyes: SlotDyes): CharacterDyes {
  return {
    r: dyes.rDisabled ? null : dyes.r,
    g: dyes.gDisabled ? null : dyes.g,
    b: dyes.bDisabled ? null : dyes.b,
    a: dyes.aDisabled ? null : dyes.a,
  }
}
