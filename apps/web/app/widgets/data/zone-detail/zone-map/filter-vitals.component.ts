import { GridOptions } from '@ag-grid-community/core'
import { Component, Injector, computed, effect, inject, input, output, signal, untracked } from '@angular/core'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { NW_MAX_ENEMY_LEVEL } from '@nw-data/common'
import { VitalsCategoryData } from '@nw-data/generated'
import { Point } from 'geojson'
import { sortBy, uniq } from 'lodash'
import { MapGeoJSONFeature } from 'maplibre-gl'
import { Observable, debounceTime, filter, map } from 'rxjs'
import { NwDataService } from '~/data'
import { NwModule } from '~/nw'
import { DataViewAdapter, DataViewCategory, DataViewPicker } from '~/ui/data/data-view'
import { TableGridUtils } from '~/ui/data/table-grid'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'
import { ExpressionTreeModule } from '~/ui/expression-tree'
import { TreeNodeComponent, TreeNodeToggleComponent } from '~/ui/tree'
import { GameMapLayerDirective, GameMapPopupComponent } from '~/widgets/game-map'
import {
  ExpressionBranchKeyDirective,
  ExpressionBranchValueDirective,
  ExpresssionBranchEditorComponent,
} from '../../../../ui/expression-branch/expresssion-branch-input.component'
import { VitalDetailModule } from '../../vital-detail'
import { VitalTableAdapter } from '../../vital-table'
import { VitalDataProperties, VitalDataSet } from './data/types'
import { FilterVitalsStore } from './filter-vitals.store'
import { ZoneMapStore } from './zone-map.store'

@Component({
  standalone: true,
  selector: 'nwb-map-filter-vitals',
  templateUrl: './filter-vitals.component.html',
  host: {
    class: 'h-full flex flex-col',
  },
  providers: [FilterVitalsStore],
  imports: [
    ExpressionBranchKeyDirective,
    ExpressionBranchValueDirective,
    ExpressionTreeModule,
    ExpresssionBranchEditorComponent,
    FormsModule,
    GameMapLayerDirective,
    GameMapPopupComponent,
    NwModule,
    TreeNodeComponent,
    TreeNodeToggleComponent,
    VitalDetailModule,
  ],
})
export class MapFilterVitalsComponent {
  private injector = inject(Injector)
  protected mapStore = inject(ZoneMapStore)
  protected store = inject(FilterVitalsStore)
  public data = input.required<VitalDataSet>()
  public featureHover = output<VitalDataProperties[]>()
  protected popupPosition = signal<[number, number]>(null)
  protected hoverItems = signal<
    Array<{
      position: [number, number]
      data: VitalDataProperties
    }>
  >(null)

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

  public constructor() {
    effect(() => {
      const hide = !this.mapStore.showEncounter()
      untracked(() => {
        this.store.setHideRandomEncounters(hide)
      })
    })
  }

  protected pickVitalId(input: ExpresssionBranchEditorComponent, index: number, value: string) {
    DataViewPicker.from({
      injector: this.injector,
      title: 'Pick Vital',
      dataView: { adapter: VitalTableAdapter },
      selection: value ? [value] : null,
    })
      .pipe(
        filter((it) => it !== undefined),
        map((it) => it?.[0] as string),
      )
      .subscribe((value) => {
        if (value) {
          input.updateRow(index, { right: value.toLowerCase() })
        } else {
          input.removeRow(index)
        }
      })
  }

  protected pickVitalType(input: ExpresssionBranchEditorComponent, index: number, value: string) {
    DataViewPicker.from<CreatureType>({
      dataView: {
        adapter: CreatureTypesAdapter,
      },
      injector: this.injector,
      title: 'Select Creature Type',
      selection: value ? [value] : null,
    })
      .pipe(
        filter((it) => it !== undefined),
        map((it) => it?.[0] as string),
      )
      .subscribe((value) => {
        if (value) {
          input.updateRow(index, { right: value.toLowerCase() })
        } else {
          input.removeRow(index)
        }
      })
  }

  protected pickVitalCategory(input: ExpresssionBranchEditorComponent, index: number, value: string) {
    DataViewPicker.from<VitalsCategoryData>({
      dataView: {
        adapter: CategoryAdapter,
      },
      injector: this.injector,
      title: 'Select Category',
      selection: value ? [value] : null,
    })
      .pipe(
        filter((it) => it !== undefined),
        map((it) => it?.[0] as string),
      )
      .subscribe((value) => {
        if (value) {
          input.updateRow(index, { right: value.toLowerCase() })
        } else {
          input.removeRow(index)
        }
      })
  }

  protected pickVitalLootTag(input: ExpresssionBranchEditorComponent, index: number, value: string) {
    DataViewPicker.from<LootTag>({
      dataView: {
        adapter: LootTagsAdapter,
      },
      injector: this.injector,
      title: 'Select Loot Tag',
      selection: value ? [value] : null,
    })
      .pipe(
        filter((it) => it !== undefined),
        map((it) => it?.[0] as string),
      )
      .subscribe((value) => {
        if (value) {
          input.updateRow(index, { right: value.toLowerCase() })
        } else {
          input.removeRow(index)
        }
      })
  }

  protected pickVitalPoiTag(input: ExpresssionBranchEditorComponent, index: number, value: string) {
    DataViewPicker.from<POITag>({
      dataView: {
        adapter: POITagsAdapter,
      },
      injector: this.injector,
      title: 'Select POI Tag',
      selection: value ? [value] : null,
    })
      .pipe(
        filter((it) => it !== undefined),
        map((it) => it?.[0] as string),
      )
      .subscribe((value) => {
        if (value) {
          input.updateRow(index, { right: value.toLowerCase() })
        } else {
          input.removeRow(index)
        }
      })
  }

  protected handleMouseEnter(features: MapGeoJSONFeature[]) {
    const items = features.map((it) => it.properties as VitalDataProperties)
    this.featureHover.emit(items)

    this.hoverItems.set(
      features.map((it) => {
        const point = (it.geometry as any as Point)?.coordinates
        const props = it.properties as VitalDataProperties
        return { position: [point[0], point[1]], data: props }
      }),
    )
  }

  protected handleMouseMove(features: MapGeoJSONFeature[]) {
    const items = features.map((it) => it.properties as VitalDataProperties)
    this.featureHover.emit(items)

    this.hoverItems.set(
      features.map((it) => {
        const point = (it.geometry as any as Point)?.coordinates
        const props = it.properties as VitalDataProperties
        return { position: [point[0], point[1]], data: props }
      }),
    )
  }

  protected handleMouseLeave(features: MapGeoJSONFeature[]) {
    this.featureHover.emit(null)
    this.hoverItems.set(null)
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


export interface CreatureType {
  CreatureTypeID: string
}
export class CreatureTypesAdapter implements DataViewAdapter<CreatureType> {
  private db = inject(NwDataService)
  private utils: TableGridUtils<CreatureType> = inject(TableGridUtils)

  public entityID(item: CreatureType): string | number {
    return item.CreatureTypeID.toLowerCase()
  }

  public entityCategories(item: CreatureType): DataViewCategory[] {
    return null
  }

  public connect(): Observable<CreatureType[]> {
    return this.db.vitals.pipe(
      map((list) => list.map((it) => it.CreatureType).flat()),
      map((list) => uniq(list).sort()),
      map((list) => list.map((it) => ({ CreatureTypeID: it }))),
    )
  }

  public gridOptions(): GridOptions<CreatureType> {
    return {
      columnDefs: [{ field: 'CreatureTypeID', headerName: 'ID', width: 500 }],
    }
  }
  public virtualOptions(): VirtualGridOptions<CreatureType> {
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

export interface POITag {
  POITagID: string
}
export class POITagsAdapter implements DataViewAdapter<POITag> {
  private db = inject(NwDataService)
  private utils: TableGridUtils<POITag> = inject(TableGridUtils)

  public entityID(item: POITag): string | number {
    return item.POITagID.toLowerCase()
  }

  public entityCategories(item: POITag): DataViewCategory[] {
    return null
  }

  public connect(): Observable<POITag[]> {
    return this.db.territories.pipe(
      map((list) => list.filter((it) => it.POITag?.length)),
      map((list) => uniq(list.map((it) => it.POITag).flat()).sort()),
      map((list) => list.map((it) => ({ POITagID: it }))),
    )
  }

  public gridOptions(): GridOptions<POITag> {
    return {
      columnDefs: [{ field: 'POITagID', headerName: 'ID', width: 500 }],
    }
  }
  public virtualOptions(): VirtualGridOptions<POITag> {
    return null
  }
}
