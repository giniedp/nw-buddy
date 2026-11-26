import { Component, computed, inject, input } from '@angular/core'
import { groupBy, sortBy } from 'lodash'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { FilterDataSet } from './data/types'
import { MapFilterSectionComponent } from './filter-section.component'
import { MapFilterStatusComponent } from './filter-status.component'
import { formatCount } from './utils/format-count'
import { ZoneMapStore } from './zone-map.store'

@Component({
  selector: 'nwb-map-filter-segment',
  template: `
    <div class="flex-1">
      @if (rows()?.length) {
        <div class="p-1">
          <nwb-quicksearch-input />
        </div>
      }
      @for (row of rows(); track row.key) {
        <nwb-map-filter-section [source]="row.items" [search]="search.query()" />
      }
    </div>
    <nwb-map-filter-status [visible]="visible()" [canClear]="hasActive()" (clear)="clearAll()" />
  `,
  host: {
    class: 'flex flex-col min-h-full',
  },
  imports: [MapFilterSectionComponent, MapFilterStatusComponent, QuicksearchModule],
  providers: [QuicksearchService],
})
export class MapFilterSegmentComponent {
  protected search = inject(QuicksearchService)
  private store = inject(ZoneMapStore)
  public source = input.required<FilterDataSet[]>()
  protected mapId = this.store.mapId

  /**
   * Layers with points on the current map
   */
  protected items = computed(() => {
    const mapId = this.mapId()
    return this.source().filter((it) => !!it.data[mapId]?.count)
  })

  protected rows = computed(() => {
    const entries = Object.entries(groupBy(this.items(), (it) => it.section)).map(([section, items]) => {
      return {
        key: section,
        items,
      }
    })
    return sortBy(entries, ({ key }) => key)
  })

  protected hasActive = computed(() => {
    const selection = this.store.layers()
    return this.items().some((it) => !!selection[it.id])
  })

  protected visible = computed(() => {
    const mapId = this.mapId()
    const selection = this.store.layers()
    let count = 0
    for (const layer of this.items()) {
      const selected = selection[layer.id]
      const data = layer.data[mapId]
      if (!selected || !data) {
        continue
      }
      // hidden by the layer filter of the category
      if (layer.properties.encounter?.includes('random')) {
        continue
      }
      if (!selected.variants) {
        count += data.count
        continue
      }
      for (const variant of selected.variants) {
        count += data.variantCounts[variant] || 0
      }
    }
    return formatCount(count)
  })

  protected clearAll() {
    this.store.setLayersEnabled(
      this.source().map((it) => it.id),
      false,
    )
  }
}
