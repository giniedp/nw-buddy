import { EquipmentSetData } from "@nw-data/generated";

type PerkKeys = Extract<keyof EquipmentSetData, `Perk${number}`>
type ThresholdKeys = Extract<keyof EquipmentSetData, `Perk${number}Threshold`>

export type EquipmentSetPerk = {
  PerkID: string
  PerkThreshold: number
}
export type EquipmentSet = Omit<EquipmentSetData, PerkKeys | ThresholdKeys> & {
  Perks: EquipmentSetPerk[]
}

export function convertSetBonuses(items: EquipmentSetData[]) {
  return items.map(convertSetBonus)
}

export function convertSetBonus(item: EquipmentSetData) {
  const result: EquipmentSet = {
    EquipmentSetId: item.EquipmentSetId,
    Description: item.Description,
    DisplayName: item.DisplayName,
    ItemIds: item.ItemIds,
    Perks: [],
  }
  for (const key of Object.keys(item)) {
    const match = key.match(/^Perk(\d+)$/)
    if (!match) {
      continue
    }
    const index = Number(match[1])
    const perkId = item[`Perk${index}`]
    const threshold = item[`Perk${index}Threshold`]
    if (!perkId || !threshold) {
      continue
    }
    result.Perks.push({
      PerkID: perkId,
      PerkThreshold: threshold
    })
  }
  return result
}
