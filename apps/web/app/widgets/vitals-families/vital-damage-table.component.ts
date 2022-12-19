import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { Damagetable, Vitals } from '@nw-data/types'
import { combineLatest, map, Observable, of, ReplaySubject, switchMap } from 'rxjs'
import { NwDbService, NwModule } from '~/nw'
import { getWeaponTagLabel } from '~/nw/utils'
import { NwWeaponTypesService } from '~/nw/weapon-types'
import { CaseInsensitiveMap, humanize } from '~/utils'

@Component({
  standalone: true,
  selector: 'nwb-vital-damage-table',
  templateUrl: './vital-damage-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule],
  host: {
    class: 'layout-content',
  },
})
export class VitalDamageTableComponent {

  @Input()
  public set vitalId(id: string) {
    this.vitalId$.next(id)
  }

  private vitalId$ = new ReplaySubject<string>(1)
  private damageTableFns = this.getDamageTableFns()

  protected rows$ = this.db.vital(this.vitalId$)
    .pipe(switchMap((vital) => this.damageTable(vital)))
    .pipe(map((rows) => {
      return rows.map((row) => {
        return {
          Name: humanize(row.DamageID.replace(/^Attack/,'')),
          DamageTypeName: `${row.DamageType}_DamageName` ,
          DamageTypeIcon: this.dmg.damageTypeIcon(row.DamageType),
          WeaponCategory: getWeaponTagLabel(row.WeaponCategory) || row.WeaponCategory,
          AttackType: row.AttackType,
        }
      })
    }))


  public constructor(private db: NwDbService, private dmg: NwWeaponTypesService) {

  }


  private damageTable(vital: Vitals) {
    const fns = this.damageTableFns
    const categories = vital?.VitalsCategories?.map((it) => it.replace(/_/gi, '')) || []
    console.log(vital.VitalsID)
    console.log(categories)
    console.log(Array.from(fns.keys()).sort())
    const key = categories.find((cat) => fns.get(cat))
    const fn = fns.get(key)
    if (!fn) {
      return of<Damagetable[]>([])
    }
    console.log(fn)
    return this.db.data[fn]() as Observable<Damagetable[]>
  }

  private getDamageTableFns() {
    return this.db.data.apiMethods
      .map((it) => {
        const tokens = it.split(/damagetable/i)
        return {
          fn: it,
          key: tokens[1],
        }
      })
      .filter((it) => !!it.key)
      .reduce((res, { key, fn }) => {
        res.set(key, fn)
        return res
      }, new CaseInsensitiveMap<string, string>())
  }
}
