import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  Input,
  ChangeDetectorRef,
} from '@angular/core'
import { Damagetable } from '@nw-data/types'
import { chain, groupBy, mapValues, uniq } from 'lodash'
import { combineLatest, defer, map, ReplaySubject, shareReplay, Subject, takeUntil } from 'rxjs'
import { NwService } from '~/core/nw'

const FAMILY_META = {
  wildlife: {
    Icon: 'nw-data/MissionImages/missionimage_wolf.png',
    Name: '@VC_Beast',
  },
  ancientguardian: {
    Icon: 'nw-data/MissionImages/missionimage_ancient1.png',
    Name: '@VC_Ancient',
  },
  corrupted: {
    Icon: 'nw-data/MissionImages/missionImage_corrupted2.png',
    Name: '@VC_Corrupted',
  },
  angryearth: {
    Icon: 'nw-data/MissionImages/missionimage_angryearth1.png',
    Name: '@VC_Angryearth',
  },
  lost: {
    Icon: 'nw-data/MissionImages/missionimage_undead1.png',
    Name: '@VC_Lost',
  },
}

@Component({
  selector: 'nwb-vitals-family-info',
  templateUrl: './vitals-family-info.component.html',
  styleUrls: ['./vitals-family-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'card bg-base-100 shadow-xl',
  },
})
export class VitalsFamilyInfoComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  public set family(value: string) {
    this.familyName$.next(value)
    this.familyName = value
  }

  public familyName: string
  public creatureTypes: string[]
  public creatureType: string
  public data: any

  private familyName$ = new ReplaySubject<string>(1)
  private creatureType$ = new ReplaySubject<string>(1)
  private destroy$ = new Subject()

  private source$ = defer(() => {
    return combineLatest({
      name: this.familyName$,
      vitals: this.nw.db.vitalsByFamily,
    })
  })
    .pipe(
      map(({ name, vitals }) => {
        return {
          name: name,
          vitals: vitals.get(name),
        }
      })
    )
    .pipe(
      shareReplay({
        refCount: true,
        bufferSize: 1,
      })
    )

  private type$ = defer(() => this.source$)
    .pipe(
      map(({ vitals }) => {
        const types = vitals.map((it) => it.CreatureType)
        return Array.from(new Set(types)).filter((it) => !!it)
      })
    )
    .pipe(
      shareReplay({
        refCount: true,
        bufferSize: 1,
      })
    )

  private vital$ = defer(() => {
    return combineLatest({
      type: this.creatureType$,
      source: this.source$,
    })
  })
    .pipe(
      map(({ type, source: { vitals } }) => {
        return vitals.filter((it) => it.CreatureType === type)
      })
    )
    .pipe(
      shareReplay({
        refCount: true,
        bufferSize: 1,
      })
    )

  private weapon$ = defer(() => {
    return this.nw.db.damageTable0.pipe(
      map((damagetable) => {
        const data = damagetable
          .filter((it) => it.DamageID.includes('Primary') || it.DamageID === '1H_Sword_Attack1' || it.DamageID === 'MusketAttack1' || it.DamageID === 'BowAttack1')
          .filter((it) => it.AttackType === 'Light' || it.AttackType === 'Heavy')
          .map((it) => {
            return {
              Weapon: it.DamageID
                .replace(/_Primary.*$/i, '')
                .replace(/_Damage.*$/i, '')
                .replace(/_?Attack.*$/i, '')
                .replace(/^\dH_/i, ''),
              Damage: it.DamageType,
            }
          })
        return mapValues(groupBy(data, (it) => it.Damage), (it) => uniq(it.map((i) => i.Weapon)) )
      })
    )
  })
  .pipe(
    shareReplay({
      refCount: true,
      bufferSize: 1,
    })
  )

  public constructor(private nw: NwService, private cdRef: ChangeDetectorRef) {
    //
  }

  public ngOnInit(): void {
    this.type$.pipe(takeUntil(this.destroy$)).subscribe((types) => {
      this.creatureTypes = types
      this.selectType(types.find((it) => it === 'Dungeon') || types.find((it) => it === 'Solo+') || types[0])
    })

    combineLatest({
      type: this.type$,
      family: this.familyName$,
      vitals: this.vital$,
      damagetypes: this.nw.db.damagetypes,
      affixstats: this.nw.db.affixStats,
      perks: this.nw.db.perks,
      weapons: this.weapon$,
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ family, type, vitals, damagetypes, affixstats, perks, weapons }) => {
        const common = mostCommonProps(vitals, [
          'ABSArcane',
          'ABSCorruption',
          'ABSFire',
          'ABSIce',
          'ABSLightning',
          'ABSNature',

          'ABSSiege',
          'ABSSlash',
          'ABSStandard',
          'ABSStrike',
          'ABSThrust',

          'WKNArcane',
          'WKNCorruption',
          'WKNFire',
          'WKNIce',
          'WKNLightning',
          'WKNNature',

          'WKNSiege',
          'WKNSlash',
          'WKNStandard',
          'WKNStrike',
          'WKNThrust',
        ])

        const gems = perks
          .filter((it) => it.PerkType === 'Gem')
          .map((perk) => {
            return {
              perk,
              stat: affixstats.find((it) => it.StatusID === perk.Affix),
            }
          })
          .filter((it) => !!it.stat)
        const data = {
          Type: type,
          Icon: FAMILY_META[family]?.Icon,
          Name: FAMILY_META[family]?.Name || family,
          Damage: damagetypes
            .map((it) => {
              return {
                Name: it.DisplayName,
                Type: it.TypeID,
                Category: it.Category,
                Value: (common[`WKN${it.TypeID}`] || 0) - (common[`ABS${it.TypeID}`] || 0),
                Perk: gems.filter(({ stat }) => stat.DamageType === it.TypeID).map(({ perk }) => perk).reverse()?.[0],
                Weapons: weapons[it.TypeID] || [],
              }
            })
            .filter((it) => !!it.Value)
            .sort((a, b) => b.Value - a.Value),
        }
        this.data = data
        this.cdRef.markForCheck()
      })
  }

  public ngOnChanges(): void {
    //
  }

  public ngOnDestroy(): void {
    this.destroy$.next(null)
    this.destroy$.complete()
  }

  public selectType(type: string) {
    this.creatureType = type
    this.creatureType$.next(type)
    this.cdRef.markForCheck()
  }
}

function mostCommonProps<T>(data: T[], k: Array<keyof T>) {
  const map = new Map<
    string,
    {
      count: number
      value: Partial<T>
    }
  >()

  for (const item of data) {
    const values = k.map((it) => item[it])
    if (values.every((it) => !it)) {
      continue
    }
    const key = values.map((it) => it || '').join('-')
    if (!map.has(key)) {
      map.set(key, {
        count: 0,
        value: k.reduce((prev, lookup) => {
          prev[lookup] = item[lookup]
          return prev
        }, {} as Partial<T>),
      })
    }
    map.get(key).count += 1
  }
  return Array.from(map.values()).sort((a, b) => a.count - b.count)?.[0]?.value || {}
}
