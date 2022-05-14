import { groupBy } from 'lodash'
import { combineLatest, map, Observable, of } from 'rxjs'
import type { NwDbService } from './nw-db.service'

export interface WeaponTypes {
  WeaponTypeID: string
  GroupName: string
  IconPath: string
  DamageType: string
}

const WEAPON_TYPES: Array<WeaponTypes> = [

  {
    WeaponTypeID: 'Hatchets',
    GroupName: 'Hatchets_GroupName',
    DamageType: 'Slash',
    IconPath: 'assets/icons/weapons/1hhatchetsmall.png'
  },
  {
    WeaponTypeID: 'Rapiers',
    GroupName: 'Rapiers_GroupName',
    DamageType: 'Thrust',
    IconPath: 'assets/icons/weapons/1hrapiersmall.png'
  },
  {
    WeaponTypeID: 'Swords',
    GroupName: 'Swords_GroupName',
    DamageType: 'Slash',
    IconPath: 'assets/icons/weapons/1hswordsmall.png'
  },
  {
    WeaponTypeID: 'WarHammers',
    GroupName: 'WarHammers_GroupName',
    DamageType: 'Strike',
    IconPath: 'assets/icons/weapons/2hdemohammersmall.png'
  },
  {
    WeaponTypeID: 'GreatAxe',
    GroupName: 'GreatAxe_GroupName',
    DamageType: 'Slash',
    IconPath: 'assets/icons/weapons/2hgreataxesmall.png'
  },
  {
    WeaponTypeID: 'Muskets',
    GroupName: 'Muskets_GroupName',
    DamageType: 'Thrust',
    IconPath: 'assets/icons/weapons/2hmusketasmall.png'
  },
  {
    WeaponTypeID: 'Bows',
    GroupName: 'Bows_GroupName',
    DamageType: 'Thrust',
    IconPath: 'assets/icons/weapons/bowbsmall.png'
  },
  {
    WeaponTypeID: 'Spears',
    GroupName: 'Spears_GroupName',
    DamageType: 'Thrust',
    IconPath: 'assets/icons/weapons/spearasmall.png'
  },
  {
    WeaponTypeID: 'StavesFire',
    GroupName: 'StavesFire_GroupName',
    DamageType: 'Fire',
    IconPath: 'assets/icons/weapons/stafffiresmall.png'
  },
  {
    WeaponTypeID: 'StavesLife',
    GroupName: 'StavesLife_GroupName',
    DamageType: 'Nature',
    IconPath: 'assets/icons/weapons/stafflifesmall.png'
  },
  {
    WeaponTypeID: 'GauntletVoid',
    GroupName: 'GauntletVoid_GroupName',
    DamageType: 'Corruption',
    IconPath: 'assets/icons/weapons/voidgauntletsmall.png'
  },
  {
    WeaponTypeID: 'GauntletIce',
    GroupName: 'GauntletIce_GroupName',
    DamageType: 'Ice',
    IconPath: 'assets/icons/weapons/icegauntletsmall.png'
  },
  {
    WeaponTypeID: 'Blunderbuss',
    GroupName: 'Blunderbuss_GroupName',
    DamageType: 'Thrust',
    IconPath: 'assets/icons/weapons/blunderbusssmall.png'
  },
]

export function queryDamageTypeToWeaponType(): Observable<Record<string, WeaponTypes[]>> {
  return of(WEAPON_TYPES).pipe(
    map((table) => groupBy(table, (it) => it.DamageType))
  )
}

export function queryGemPerksWithAffix(db: NwDbService) {
  return combineLatest({
    perks: db.perks,
    affixstats: db.affixStats,
  }).pipe(
    map(({ perks, affixstats }) => {
      return perks
        .filter((it) => it.PerkType === 'Gem')
        .map((perk) => {
          return {
            perk,
            stat: affixstats.find((it) => it.StatusID === perk.Affix),
          }
        })
        .filter((it) => !!it.stat)
    })
  )
}

export function queryMutatorDifficultiesWithRewards(db: NwDbService) {
  return combineLatest({
    events: db.gameEventsMap,
    difficulties: db.mutatorDifficulties,
  })
  .pipe(map(({ events, difficulties }) => {
    return difficulties.map((difficulty) => {
      return {
        difficulty,
        rewards: [
          events.get(difficulty.CompletionEvent1),
          events.get(difficulty.CompletionEvent2),
          events.get(difficulty.CompletionEvent3)
        ]
      }
    })
  }))
}
