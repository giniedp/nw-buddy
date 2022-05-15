import { Injectable } from "@angular/core"
import { Vitals } from "@nw-data/types"
import { defer } from "rxjs"
import { NwDbService } from "./nw-db.service"

const CREATURE_TYPE_MARKER = {
  Boss: 'boss',
  // Critter
  Dungeon: 'dungeon',
  'Dungeon+': 'dungeon', // TODO
  'Dungeon-': 'dungeonminus',
  DungeonBoss: 'boss',
  DungeonMiniBoss: 'groupplus',
  Elite: 'group',
  'Elite+': 'groupplus',
  'Elite-': 'groupminus',
  EliteBoss: 'boss',
  EliteMiniBoss: 'groupplus',
  // Player: '',
  'Named_Solo+': 'soloplus', // TODO
  Solo: 'solo',
  'Solo+': 'soloplus',
  'Solo-': 'solominus'
}

export type VitalDamageType =
  | 'Arcane'
  | 'Corruption'
  | 'Fire'
  | 'Ice'
  | 'Lightning'
  | 'Nature'
  | 'Siege'
  | 'Slash'
  | 'Standard'
  | 'Strike'
  | 'Thrust'
@Injectable({ providedIn: 'root' })
export class NwVitalsService {

  public index = defer(() => this.db.vitalsMap)

  public iconStronattack = 'assets/icons/strongattack.png'
  public iconWeakattack = 'assets/icons/weakattack.png'

  public constructor(private db: NwDbService) {

  }

  public creatureTypeicon(type: string) {
    const marker = CREATURE_TYPE_MARKER[type]
    return marker && `assets/icons/marker/marker_ai_level_bg_${marker}.png`
  }

  public vitalMarkerIcon(vital: Vitals) {
    return this.creatureTypeicon(vital?.CreatureType)
  }

  public damageEffectiveness(vital: Vitals, damageType: VitalDamageType) {
    return (vital[`WKN${damageType}`] - vital[`ABS${damageType}`]) || 0
  }

  public damageEffectivenessPercent(vital: Vitals, damageType: VitalDamageType) {
    return Math.round(this.damageEffectiveness(vital, damageType) * 100)
  }

}
