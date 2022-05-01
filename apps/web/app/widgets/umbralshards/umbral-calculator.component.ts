import { Component, OnInit, ChangeDetectionStrategy, OnDestroy, OnChanges, SimpleChanges, ChangeDetectorRef, TrackByFunction } from '@angular/core';
import { combineLatest, defer, map, Subject, takeUntil } from 'rxjs';
import { NwService } from '~/core/nw';
import { PreferencesService, StorageScopeNode, StorageNode } from '~/core/preferences';

export interface UCRow {
  id: string,
  name: string
  weight: number
  value?: number
  shards?: number
  contribution?: number
  next?: boolean
}

const BASE = [
  { id: 'head', name: 'ui_itemtypedescription_head_slot', weight: 0.07 },
  { id: 'chest', name: 'ui_itemtypedescription_chest_slot', weight: 0.12 },
  { id: 'hands', name: 'ui_itemtypedescription_hands_slot', weight: 0.06 },
  { id: 'legs', name: 'ui_itemtypedescription_legs_slot', weight: 0.07  },
  { id: 'feet', name: 'ui_itemtypedescription_feet_slot', weight: 0.035 },
  { id: 'weapon1', name: 'ui_weapon1', weight: 0.225 },
  { id: 'weapon2', name: 'ui_weapon2', weight: 0.225 },
  { id: 'ring', name: 'ui_ring_slot_tooltip', weight: 0.065 },
  { id: 'earring', name: 'ui_unlock_token_slot', weight: 0.065 },
  { id: 'amulet', name: 'ui_amulet_slot_tooltip', weight: 0.065 },

]

@Component({
  selector: 'nwb-umbral-calculator',
  templateUrl: './umbral-calculator.component.html',
  styleUrls: ['./umbral-calculator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UmbralCalculatorComponent implements OnInit, OnChanges, OnDestroy {

  public trackById: TrackByFunction<UCRow> = (i, row) => {
    return row.id
  }

  public data: UCRow[] = []
  public upgradeNext: UCRow[]
  public totalGS: number = null

  private source$ = defer(() => {
    return combineLatest(BASE.map((it) => {
      return this.storage.observe<number>(it.id).pipe(map((data): UCRow => {
        return {
          id: it.id,
          name: it.name,
          weight: it.weight,
          value: data.value,
        }
      }))
    }))
  })

  private destroy$ = new Subject()
  private storage: StorageNode

  public constructor(private nw: NwService, pref: PreferencesService, private cdRef: ChangeDetectorRef) {
    this.storage = pref.storage.storageObject('umbral-calculator')
  }

  public ngOnInit(): void {
    combineLatest({
      table: this.nw.db.data.datatablesUmbralgsupgrades(),
      input: this.source$
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe(({ table, input }) => {
      for (const row of input) {
        row.shards = table.find((it) => it.Level === row.value)?.RequiredItemQuantity || 0
        if (row.shards) {
          row.contribution = row.weight / row.shards
        } else {
          row.contribution = 0
        }
      }
      const minLevel = Math.min(...table.map((it) => it.Level))
      const maxLevel = Math.max(...table.map((it) => it.Level))
      this.totalGS = 0
      for (const row of input) {
        this.totalGS += row.weight * row.value
        row.next = input.every((it) => row.contribution >= it.contribution)
        if (row.value < minLevel || row.value > maxLevel) {
          row.next = false
        }
      }
      this.data = input
      this.upgradeNext = input.filter((it) => it.next)
      this.cdRef.markForCheck()
    })
  }

  public ngOnChanges(): void {

  }

  public ngOnDestroy(): void {
    this.destroy$.next(null)
    this.destroy$.complete()
  }

  public writeValue(id: string, value: number) {
    this.storage.set(id, value)
  }
}
