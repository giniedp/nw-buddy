import { Component, computed, inject, input, viewChildren } from '@angular/core'
import { uniq } from 'lodash'
import { NwModule } from '~/nw'
import { humanize } from '~/utils'
import { MapFilterCategoryComponent } from './filter-category.component'
import { ZoneMapStore } from './zone-map.store'

@Component({
  standalone: true,
  selector: 'nwb-map-filter-section',
  template: `
    <details>
      <summary class="btn btn-block btn-ghost rounded-none flex flex-row justify-between items-center">
        <span class="flex flex-row items-center gap-2" [class.text-primary]="isActive()">
          @if (icon()) {
            <img [nwImage]="icon()" class="w-6" />
          }
          {{ label() | nwText }}
        </span>
      </summary>
      <div class="pl-8 space-y-1">
        @for (category of categories(); track category) {
          <nwb-map-filter-category [tab]="tab()" [section]="section()" [category]="category" />
        }
      </div>
    </details>
  `,
  imports: [NwModule, MapFilterCategoryComponent],
  host: {
    class: 'block',
    '[class.text-neutral-500]': '!hasPoints()'
  },
})
export class MapFilterSectionComponent {
  protected store = inject(ZoneMapStore)
  protected mapId = this.store.mapId
  public tab = input.required<string>()
  public section = input.required<string>()
  protected children = viewChildren(MapFilterCategoryComponent)

  protected data = computed(() => {
    const items = this.store.gatherables().filter((it) => it.section === this.section())
    const categories = uniq(items.map((it) => it.category)).sort()
    const first = items[0]

    return {
      items,
      categories,
      label: first?.sectionLabel || humanize(first?.section),
      icon: first?.sectionIcon,
    }
  })
  protected pointsTotal = computed(() => {
    let count = 0
    for (const item of this.items()) {
      count += (item.data[this.mapId()]?.count || 0)
    }
    return count
  })

  protected hasPoints = computed(() => this.pointsTotal() > 0)
  protected items = computed(() => this.data().items)
  protected categories = computed(() => this.data().categories)
  protected label = computed(() => this.data().label)
  protected icon = computed(() => this.data().icon)
  protected isActive = computed(() => {
    return this.children().some((it) => it.isAnyEnabled())
  })
}
