import { Component, OnInit, ChangeDetectionStrategy, Input } from '@angular/core'
import { Vitals } from '@nw-data/types'
import { combineLatest, defer, map, merge, ReplaySubject, switchMap } from 'rxjs'
import { NwDamagetypeService, NwService, NwVitalsService } from '~/core/nw'
import { DestroyService } from '~/core/utils'

const FAMILY_META = {
  wildlife: {
    Icon: 'assets/images/missionimage_wolf.png',
    Name: 'VC_Beast',
  },
  ancientguardian: {
    Icon: 'assets/images/missionimage_ancient1.png',
    Name: 'VC_Ancient',
  },
  corrupted: {
    Icon: 'assets/images/missionimage_corrupted2.png',
    Name: 'VC_Corrupted',
  },
  angryearth: {
    Icon: 'assets/images/missionimage_angryearth1.png',
    Name: 'VC_Angryearth',
  },
  lost: {
    Icon: 'assets/images/missionimage_undead1.png',
    Name: 'VC_Lost',
  },
}

@Component({
  selector: 'nwb-vital-detail',
  templateUrl: './vital-detail.component.html',
  styleUrls: ['./vital-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  host: {
    class: 'backdrop-blur-sm bg-white/10 rounded-md overflow-clip'
  }
})
export class VitalDetailComponent implements OnInit {
  @Input()
  public set vital(value: Vitals) {
    this.vitalInput$.next(value)
  }

  @Input()
  public set family(value: string) {
    this.familyInput$.next(value)
  }

  @Input()
  public showPortrait: boolean

  public familyName = defer(() => this.vital$).pipe(map((it) => FAMILY_META[it?.Family]?.Name))
  public familyIcon = defer(() => this.vital$).pipe(map((it) => FAMILY_META[it?.Family]?.Icon))

  public stats$ = defer(() => {
    return combineLatest({
      vital: this.vital$,
      gems: this.nw.db.viewGemPerksWithAffix,
      dmgwpn: this.dmg.damageTypeToWeaponType,
      damagetypes: this.dmg.damagetypes
    })
  }).pipe(
    map(({ vital, gems, damagetypes, dmgwpn }) => {
      return damagetypes.map((dmgType) => {
        return {
          Name: dmgType.DisplayName,
          Type: dmgType.TypeID,
          Category: dmgType.Category,
          Icon: this.dmg.damageTypeIcon(dmgType),
          Value: this.vitals.damageEffectiveness(vital, dmgType.TypeID as any),
          Perk: gems.filter(({ stat }) => stat.DamageType === dmgType.TypeID).map(({ perk }) => perk).reverse()?.[0],
          Weapons: dmgwpn[dmgType.TypeID] || [],
        }
      })
        .filter((row) => !!row.Value)
        .sort((a, b) => a.Value - b.Value)
    })
  )

  public readonly vital$ = defer(() => {
    const vitals1 = this.vitalInput$
    const vitals2 = this.familyInput$.pipe(switchMap((it) => this.vitalForFamily(it)))
    return merge(vitals1, vitals2)
  })

  private readonly vitalInput$ = new ReplaySubject<Vitals>(1)
  private readonly familyInput$ = new ReplaySubject<string>(1)


  public constructor(
    private nw: NwService,
    private dmg: NwDamagetypeService,
    private vitals: NwVitalsService,

  ) {
    //
  }

  public ngOnInit(): void {
    //
  }

  public vitalForFamily(family: string) {
    return this.nw.db.vitalsByFamily.pipe(map((it) => it.get(family)))
      .pipe(map((vitals): Partial<Vitals> => {
        return {
          Family: family,
          ...mostCommonProps(vitals, [
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
        }
      }))
      .pipe(map((it) => it as Vitals))
  }
}

function mostCommonProps<T>(data: T[], k: Array<keyof T>): Partial<T> {
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
  return Array.from(map.values()).sort((a, b) => b.count - a.count)?.[0]?.value || {}
}
