import { MasterItemDefinitions, ArmorAppearanceDefinitions, WeaponAppearanceDefinitions } from '@nw-data/generated'
import { eqCaseInsensitive } from '~/utils'

export type TransmogAppearance = ArmorAppearanceDefinitions | WeaponAppearanceDefinitions

export type TransmogGender = 'male' | 'female'

export interface DyeSlot {
  channel: string
  name: string
  color: string
  colorStrength: number
  dyeEnabled: boolean
  dyeStrength: number
  dyeOverride: number // TODO: research, how does that apply?
}

export interface TransmogItem {
  id: string
  gearsetId: string
  category: string
  subcategory: string
  appearance: TransmogAppearance
  male: TransmogItem
  female: TransmogItem
  set: TransmogItem[]
  items: MasterItemDefinitions[]
  itemSets: string[]
}

export function getAppearanceId(item: TransmogAppearance) {
  if (!item) {
    return null
  }
  if ('ItemID' in item) {
    return item.ItemID
  }
  if ('WeaponAppearanceID' in item) {
    return item.WeaponAppearanceID
  }
  return null
}

export function getAppearanceIdName(item: TransmogAppearance) {
  if (!item) {
    return null
  }
  if ('AppearanceName' in item) {
    return item.AppearanceName
  }
  return getAppearanceId(item)
}

export function isTransmogUnique(item: TransmogItem) {
  return item.itemSets?.length === 1
}

export function isTransmogSkin(item: TransmogItem) {
  if (!isTransmogUnique(item)) {
    return false
  }
  // TODO:
  return item.items[0].ItemID.includes('Skin_')
}

export function isTransmogFromShop(item: TransmogItem) {
  if (!isTransmogUnique(item)) {
    return false
  }
  return eqCaseInsensitive(item.items[0]['$source'], 'store')
}

export function haveAppearancesSameModelFile(a: TransmogAppearance, b: TransmogAppearance): boolean {
  return eqCaseInsensitive(String(getAppearanceModelFile(a)), String(getAppearanceModelFile(b)))
}

export function getAppearanceModelFile(it: TransmogAppearance) {
  if (!it) {
    return ''
  }
  return String(
    (it as ArmorAppearanceDefinitions).Skin1 ||
      (it as ArmorAppearanceDefinitions).Skin2 ||
      (it as WeaponAppearanceDefinitions).SkinOverride1 ||
      (it as WeaponAppearanceDefinitions).SkinOverride2 ||
      (it as WeaponAppearanceDefinitions).MeshOverride ||
      '',
  )
}

export function isAppearanceOfGender(item: TransmogAppearance, gender: TransmogGender): boolean {
  return eqCaseInsensitive(getAppearanceGender(item), gender)
}

export function getAppearanceGender(item: TransmogAppearance): TransmogGender
export function getAppearanceGender(item: ArmorAppearanceDefinitions): TransmogGender {
  return item?.Gender ? (item.Gender.toLowerCase() as TransmogGender) : null
}

export function getAppearanceDyeChannels(item: TransmogAppearance): DyeSlot[]
export function getAppearanceDyeChannels(item: ArmorAppearanceDefinitions): DyeSlot[] {
  if (!item) {
    return null
  }
  const dyeEnabled = true // DYE_CATEGOREIS.some((it) => item.ItemClass?.some((it2) => eqCaseInsensitive(it, it2)))

  return [
    {
      channel: 'R',
      name: 'Primary',
      color: item.MaskRColor,
      colorStrength: item.MaskR,
      dyeEnabled: dyeEnabled && !coarseBoolean(item.RDyeSlotDisabled ?? '0'),
      dyeStrength: item.MaskRDye,
      dyeOverride: item.MaskRDyeOverride,
    },
    {
      channel: 'G',
      name: 'Secondary',
      color: item.MaskGColor,
      colorStrength: item.MaskG,
      dyeEnabled: dyeEnabled && !coarseBoolean(item.GDyeSlotDisabled ?? '0'),
      dyeStrength: item.MaskGDye,
      dyeOverride: item.MaskGDyeOverride,
    },
    {
      channel: 'B',
      name: 'Accent',
      color: item.MaskBColor,
      colorStrength: item.MaskB,
      dyeEnabled: dyeEnabled && !coarseBoolean(item.BDyeSlotDisabled ?? '0'),
      dyeStrength: item.MaskBDye,
      dyeOverride: item.MaskBDyeOverride,
    },
    {
      channel: 'A',
      name: 'Tint',
      color: item.MaskASpecColor,
      colorStrength: item.MaskASpec,
      dyeEnabled: dyeEnabled && !coarseBoolean(item.ADyeSlotDisabled ?? '0'),
      dyeStrength: item.MaskASpecDye,
      dyeOverride: null,
    },
  ]
}

function coarseBoolean(value: string): boolean {
  if (value == null) {
    return null
  }
  return value === '1'
}
