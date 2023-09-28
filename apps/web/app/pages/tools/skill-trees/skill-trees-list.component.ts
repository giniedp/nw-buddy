import { Dialog, DialogModule } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Injector } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { combineLatest, filter, map } from 'rxjs'
import { SkillBuildsStore } from '~/data'
import { NwModule } from '~/nw'
import { QuicksearchService } from '~/ui/quicksearch'
import { SkillTreesListItemComponent } from './skill-trees-list-item.component'
import { openWeaponTypePicker } from '~/widgets/data/weapon-type'
import { NW_WEAPON_TYPES } from '~/nw/weapon-types'

@Component({
  standalone: true,
  selector: 'nwb-skill-trees-list',
  templateUrl: './skill-trees-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, SkillTreesListItemComponent, DialogModule],
  host: {
    class: 'layout-content',
  },
})
export class SkillTreesListComponent {
  protected items$ = combineLatest({
    records: this.store.records$,
    search: this.search.query$.pipe(map((it) => it.toLocaleLowerCase())),
  }).pipe(
    map(({ records, search }) => {
      if (!search) {
        return records
      }
      return records.filter((it) => {
        if ((it.name || '').toLocaleLowerCase().includes(search)) {
          return true
        }
        if ((it.weapon || '').toLowerCase().includes(search)) {
          return true
        }
        return false
      })
    })
  )
  protected trackByIndex = (i: number) => i

  public constructor(
    private store: SkillBuildsStore,
    private dialog: Dialog,
    private router: Router,
    private route: ActivatedRoute,
    private search: QuicksearchService,
    private injector: Injector
  ) {
    //
  }

  protected onCreateClicked() {
    openWeaponTypePicker({
      dialog: this.dialog,
      injector: this.injector,
    })
      .closed.pipe(
        filter((it) => !!it?.length),
        map((it) => NW_WEAPON_TYPES.find((type) => type.WeaponTypeID === String(it[0])))
      )
      .subscribe(async (weapon) => {
        const record = await this.store.createRecord({
          record: {
            id: null,
            name: `New Skill Tree`,
            tree1: null,
            tree2: null,
            weapon: weapon.WeaponTag,
          },
        })
        if (record) {
          this.router.navigate([record.id], {
            relativeTo: this.route,
          })
        }
      })
  }
}
