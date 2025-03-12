import { Component, computed, inject, input, output } from '@angular/core'
import { groupBy, sortBy } from 'lodash'
import { FilterFeatureProperties, FilterDataSet } from './data/types'
import { MapFilterSectionComponent } from './filter-section.component'
import { ZoneMapStore } from './zone-map.store'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'

@Component({
  selector: 'nwb-map-filter-segment',
  template: `
    @if (rows()?.length) {
      <div class="p-1">
        <nwb-quicksearch-input />
      </div>
    }
    @for (row of rows(); track row.key) {
      <nwb-map-filter-section [source]="row.items" [open]="open()" [search]="search.query()" />
    }
  `,
  host: {
    class: 'block',
  },
  imports: [MapFilterSectionComponent, QuicksearchModule],
  providers: [QuicksearchService],
})
export class MapFilterSegmentComponent {
  protected search = inject(QuicksearchService)
  public source = input.required<FilterDataSet[]>()
  public open = input<boolean>()
  public featureHover = output<FilterFeatureProperties[]>()
  protected mapId = inject(ZoneMapStore).mapId
  protected rows = computed(() => {
    const items = this.source().filter((it) => !!it.data[this.mapId()]?.count)
    const entries = Object.entries(groupBy(items, (it) => it.section)).map(([section, items]) => {
      return {
        key: section,
        items,
      }
    })
    return sortBy(entries, ({ key }) => key)
  })
}
