import { Component, computed, inject, input } from '@angular/core'
import { uniq } from 'lodash'
import { NwModule } from '~/nw'
import { MapFilterSectionComponent } from './filter-section.component'
import { ZoneMapStore } from './zone-map.store'

@Component({
  standalone: true,
  selector: 'nwb-map-filter-tab',
  template: `
    <details>
      <summary class="btn btn-block btn-ghost rounded-none flex flex-row justify-between items-center">
        <span class="flex flex-row items-center gap-2">
          {{ tab() }}
        </span>
      </summary>
      <div class="pl-8 space-y-1">
        @for (section of sections(); track section) {
          <nwb-map-filter-section [tab]="tab()" [section]="section" />
        }
      </div>
    </details>
  `,
  imports: [NwModule, MapFilterSectionComponent],
  host: {
    class: 'block',
  },
})
export class MapFilterTabComponent {
  protected store = inject(ZoneMapStore)
  public tab = input<string>(null)

  protected data = computed(() => {
    const items = this.store.gatherables().filter((it) => it.tab === this.tab())
    const sections = uniq(items.map((it) => it.section)).sort()

    return {
      items,
      sections,
    }
  })

  protected items = computed(() => this.data().items)
  protected sections = computed(() => this.data().sections)
}
