import blunderbuss_legendary_named_warhorn from './en/blunderbuss_legendary_named_warhorn'
import chest_rare_light_desecrated_cloth from './en/chest_rare_light_desecrated_cloth'
import earring_artifact_endless_thirst from './en/earring_artifact_endless_thirst'
import feet_uncommon_corrupted_leather_boots from './en/feet_uncommon_corrupted_leather_boots'
import hatchet_legendary_scheming_dryad from './en/hatchet_legendary_scheming_dryad'
import legs_legendary_heavy_guardian_plate_greaves from './en/legs_legendary_heavy_guardian_plate_greaves'
import ring_legendary_named_heart_of_anhurawak from './en/ring_legendary_named_heart_of_anhurawak'
import instrumentalitys_earring from './en/instrumentalitys_earring'
import rapier_legendary_mythril from './en/rapier_legendary_mythril'
import hatchet_thunders_charge_str_con from './en/hatchet_thunders_charge_str_con'
import gloves_dex_con from './en/gloves_dex_con'

import type { ScanSample } from '../types'

export const SAMPLES: { en: ScanSample[] } = {
  en: [
    blunderbuss_legendary_named_warhorn,
    chest_rare_light_desecrated_cloth,
    earring_artifact_endless_thirst,
    feet_uncommon_corrupted_leather_boots,
    hatchet_legendary_scheming_dryad,
    legs_legendary_heavy_guardian_plate_greaves,
    ring_legendary_named_heart_of_anhurawak,
    instrumentalitys_earring,
    rapier_legendary_mythril,
    hatchet_thunders_charge_str_con,
    gloves_dex_con,
  ],
}

export function sampleUrl(file: string) {
  return `/test-data/pages/tools/inventory/item-scanner/samples/${file}`
}
