import { Component, computed, inject, input, output } from '@angular/core'
import { groupBy, sortBy } from 'lodash'
import { FilterDataProperties, FilterDataSet } from './data/types'
import { MapFilterSectionComponent } from './filter-section.component'
import { ZoneMapStore } from './zone-map.store'

@Component({
  standalone: true,
  selector: 'nwb-map-filter-segment',
  template: `
    @for (row of rows(); track row.key) {
      <nwb-map-filter-section [source]="row.items" (featureHover)="featureHover.emit($event)" />
    }
  `,
  host: {
    class: 'block',
  },
  imports: [MapFilterSectionComponent],
})
export class MapFilterSegmentComponent {
  public source = input.required<FilterDataSet[]>()
  public featureHover = output<FilterDataProperties[]>()
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
