import { Injectable } from '@angular/core'
import { Vitals } from '@nw-data/types'
import { combineLatest, defer, map, Observable } from 'rxjs'
import { NwDbService } from '../nw-db.service'
import { getVitalDungeon } from '../utils/vitals'

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
  'Solo-': 'solominus',
}

const FAMILIES_ICONS = {
  Wildlife: 'assets/icons/families/bestialbane1.png',
  AncientGuardian: 'assets/icons/families/ancientbane1.png',
  Lost: 'assets/icons/families/lostbane1.png',
  Corrupted: 'assets/icons/families/corruptedbane1.png',
  AngryEarth: 'assets/icons/families/angryearthbane1.png',
  default: 'assets/icons/families/marker_icondeathdoor.png',
}

@Injectable({ providedIn: 'root' })
export class NwVitalsService {
  public all$ = defer(() => this.db.vitals)
  public byId$ = defer(() => this.db.vitalsMap)

  public iconStronattack = 'assets/icons/strongattack.png'
  public iconWeakattack = 'assets/icons/weakattack.png'

  public constructor(private db: NwDbService) {}

  public creatureTypeicon(type: string) {
    const marker = CREATURE_TYPE_MARKER[type]
    return marker && `assets/icons/marker/marker_ai_level_bg_${marker}.png`
  }

  public vitalMarkerIcon(vital: Vitals) {
    return this.creatureTypeicon(vital?.CreatureType)
  }

  public vitalFamilyIcon(vital: Vitals) {
    return FAMILIES_ICONS[vital.Family] || FAMILIES_ICONS.default
  }

  public byExpedition(gameModeId: Observable<string>) {
    return combineLatest({
      vitals: this.all$,
      dungeons: this.db.gameModes,
      dungeonId: gameModeId,
    }).pipe(
      map(({ vitals, dungeons, dungeonId }) => {
        return vitals.filter((it) => getVitalDungeon(it, dungeons)?.GameModeId === dungeonId)
      })
    )
  }
}
