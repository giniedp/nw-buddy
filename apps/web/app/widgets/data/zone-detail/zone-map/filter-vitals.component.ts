import { GridOptions } from '@ag-grid-community/core'
import { Component, Injector, computed, inject, input, output, signal } from '@angular/core'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { NW_MAX_ENEMY_LEVEL } from '@nw-data/common'
import { VitalsCategoryData } from '@nw-data/generated'
import { sortBy, uniq } from 'lodash'
import { Observable, debounceTime, map } from 'rxjs'
import { NwDataService } from '~/data'
import { DataViewAdapter, DataViewCategory, DataViewPicker } from '~/ui/data/data-view'
import { TableGridUtils } from '~/ui/data/table-grid'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'
import { ExpressionTreeModule } from '~/ui/expression-tree'
import { TreeNodeComponent, TreeNodeToggleComponent } from '~/ui/tree'
import { GameMapLayerDirective } from '~/widgets/game-map'
import { VitalDataProperties, VitalDataSet } from './data/types'
import { FilterVitalsStore } from './filter-vitals.store'
import { ZoneMapStore } from './zone-map.store'
import { MapGeoJSONFeature } from 'maplibre-gl'

@Component({
  standalone: true,
  selector: 'nwb-map-filter-vitals',
  templateUrl: './filter-vitals.component.html',
  host: {
    class: 'block p-4',
  },
  providers: [FilterVitalsStore],
  imports: [GameMapLayerDirective, FormsModule, ExpressionTreeModule, TreeNodeComponent, TreeNodeToggleComponent],
})
export class MapFilterVitalsComponent {
  protected knownFields = [
    { id: 'level', isPath: false, label: 'Level' },
    { id: 'type', isPath: false, label: 'Type' },
    { id: 'category', isPath: false, label: 'Category' },
  ]

  private injector = inject(Injector)
  private mapStore = inject(ZoneMapStore)
  protected store = inject(FilterVitalsStore)
  public data = input.required<VitalDataSet>()
  public featureHover = output<VitalDataProperties[]>()

  protected lvlMin = signal(1)
  protected lvlMax = signal(NW_MAX_ENEMY_LEVEL)
  protected lvlMinDebounced = toSignal(toObservable(this.lvlMin).pipe(debounceTime(500)))
  protected lvlMaxDebounced = toSignal(toObservable(this.lvlMax).pipe(debounceTime(500)))
  protected creatureTypes = computed(() => {
    return this.mapStore
      .vitalsTypes()
      .sort()
      .map((it) => {
        return {
          value: it,
          label: it,
        }
      })
  })

  protected categories = computed(() => {
    const result = this.mapStore.vitalsCategories().map((it) => it.toLowerCase())
    result.length = 100
    return result
  })

  protected mapId = this.mapStore.mapId
  protected layerData = computed(() => {
    const data = this.data()
    return data.data[this.mapId()]?.geometry
  })

  protected pickCategory(index: number, value: string) {
    DataViewPicker.open<VitalsCategoryData>({
      dataView: {
        adapter: CategoryAdapter,
      },
      injector: this.injector,
      title: 'Select Category',
      selection: [value],
    })
      .then((it) => it?.[0] as string)
      .then((value) => {
        this.store.updateCategoryFilter(index, { value })
      })
  }

  protected pickLootTag(index: number, value: string) {
    DataViewPicker.open<LootTag>({
      dataView: {
        adapter: LootTagsAdapter,
      },
      injector: this.injector,
      title: 'Select Loot Tag',
      selection: [value],
    })
      .then((it) => it?.[0] as string)
      .then((value) => {
        this.store.updateLootFilter(index, { value })
      })
  }

  protected handleMouseEnter(features: MapGeoJSONFeature[]){
    const items = features.map((it) => it.properties as VitalDataProperties)
    this.featureHover.emit(items)
  }

  protected handleMouseMove(features: MapGeoJSONFeature[]){
    const items = features.map((it) => it.properties as VitalDataProperties)
    this.featureHover.emit(items)
  }

  protected handleMouseLeave(features: MapGeoJSONFeature[]){
    this.featureHover.emit(null)
  }
}

export class CategoryAdapter implements DataViewAdapter<VitalsCategoryData> {
  private db = inject(NwDataService)
  private utils: TableGridUtils<VitalsCategoryData> = inject(TableGridUtils)

  public entityID(item: VitalsCategoryData): string | number {
    return item.VitalsCategoryID.toLowerCase()
  }

  public entityCategories(item: VitalsCategoryData): DataViewCategory[] {
    return null
  }

  public connect(): Observable<VitalsCategoryData[]> {
    return this.db.vitalsCategories.pipe(map((list) => sortBy(list, (it) => it.DisplayName)))
  }

  public gridOptions(): GridOptions<VitalsCategoryData> {
    return {
      columnDefs: [
        { field: 'VitalsCategoryID', headerName: 'ID', width: 500 },
        {
          field: 'DisplayName',
          headerName: 'Name',
          width: 300,
          valueFormatter: this.utils.valueFormatter(({ value }) => this.utils.tl8(value as string)),
        },
      ],
    }
  }
  public virtualOptions(): VirtualGridOptions<VitalsCategoryData> {
    return null
  }
}

export interface LootTag {
  LootTagID: string
}
export class LootTagsAdapter implements DataViewAdapter<LootTag> {
  private db = inject(NwDataService)
  private utils: TableGridUtils<LootTag> = inject(TableGridUtils)

  public entityID(item: LootTag): string | number {
    return item.LootTagID.toLowerCase()
  }

  public entityCategories(item: LootTag): DataViewCategory[] {
    return null
  }

  public connect(): Observable<LootTag[]> {
    return this.db.vitals.pipe(
      map((list) => list.map((it) => it.LootTags || []).flat()),
      map((list) => uniq(list).sort()),
      map((list) => list.map((it) => ({ LootTagID: it }))),
    )
  }

  public gridOptions(): GridOptions<LootTag> {
    return {
      columnDefs: [{ field: 'LootTagID', headerName: 'ID', width: 500 }],
    }
  }
  public virtualOptions(): VirtualGridOptions<LootTag> {
    return null
  }
}
