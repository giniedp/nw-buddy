import { CommonModule } from '@angular/common'
import { Component, Input, TrackByFunction } from '@angular/core'
import { ActivatedRoute, Router, RouterModule } from '@angular/router'
import { combineLatest, defer, map, ReplaySubject, switchMap } from 'rxjs'
import { NwDbService } from '~/nw'
import { EquipSlotId, getItemMaxGearScore, getWeightLabel, totalGearScore } from '~/nw/utils'
import { GearbuilderStore } from './gearbuidler-store'
import { GearSlotComponent } from './gearbuilder-slot.component'

@Component({
  standalone: true,
  selector: 'a[gearLink]',
  template: `
    <ng-container *ngIf="infos$ | async; let info">
      <span>{{ info.name }} </span>
      <span class="opacity-50 text-sm capitalize">
        {{ info.gs || 0 | number: '0.0-0' }} GS {{ info.weight }}
      </span>
    </ng-container>
  `,
  imports: [CommonModule, GearSlotComponent, RouterModule],
  host: {
    class: 'layout-content flex-none overflow-x-hidden',
  },
})
export class GearbuilderRowComponent {
  @Input()
  public set gearLink(id: string) {
    this.id$.next(id)
  }

  private id$ = new ReplaySubject<string>()
  private record$ = this.id$.pipe(switchMap((id) => this.store.observe(id)))
  protected infos$ = combineLatest({
    items: this.db.itemsMap,
    armors: this.db.armorsMap,
    record: this.record$,
  }).pipe(
    map(({ items, armors, record }) => {
      const gs: Array<{ id: EquipSlotId; gearScore: number }> = []
      let weight = 0
      Object.entries(record.items || {}).forEach(([slotId, entry]) => {
        const item = items.get(entry?.itemId)
        gs.push({
          id: slotId as any,
          gearScore: entry?.gearScore || item ? getItemMaxGearScore(item) : 0 || 0,
        })
        weight += (armors.get(item?.ItemStatsRef)?.WeightOverride || 0) / 10
      })
      return {
        name: record.name,
        gs: totalGearScore(gs),
        weight: getWeightLabel(weight),
      }
    })
  )

  protected weight$ = this.record$.pipe()
  public constructor(private store: GearbuilderStore, private db: NwDbService) {
    //
  }
}

@Component({
  standalone: true,
  selector: 'nwb-gearbuilder-page',
  templateUrl: './gearbuilder.component.html',
  imports: [CommonModule, GearSlotComponent, RouterModule, GearbuilderRowComponent],
  host: {
    class: 'layout-content flex-none overflow-x-hidden',
  },
})
export class GearbuilderComponent {
  protected allIds = defer(() => this.store.getIds())
  protected trackByIndex: TrackByFunction<any> = (i) => i

  public constructor(private store: GearbuilderStore, private router: Router, private route: ActivatedRoute) {
    //
  }

  protected entry(id: string) {
    return this.store.observe(id)
  }

  protected async onCreateClicked() {
    const id = await this.store.create()
    this.router.navigate([id], {
      relativeTo: this.route,
    })
  }
}
