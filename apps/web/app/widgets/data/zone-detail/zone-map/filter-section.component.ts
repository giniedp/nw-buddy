import { Component, computed, input, output, viewChildren } from '@angular/core'
import { groupBy, sortBy } from 'lodash'
import { NwModule } from '~/nw'
import { humanize } from '~/utils'
import { FilterFeatureProperties, FilterDataSet } from './data/types'
import { MapFilterCategoryComponent } from './filter-category.component'
import { IconsModule } from '~/ui/icons'

@Component({
  standalone: true,
  selector: 'nwb-map-filter-section',
  template: `
    <details>
      <summary class="btn btn-block btn-ghost rounded-none flex flex-row justify-between items-center">
        <span class="flex flex-row items-center gap-2" [class.text-primary]="isActive()">
          @if (icon()) {
            <nwb-icon [icon]="icon()" class="w-4" />
            <!-- <img [nwImage]="icon()" class="w-6" /> -->
          }
          {{ label() | nwText }}
        </span>
      </summary>
      <div class="px-4 space-y-1">
        @for (row of rows(); track row.key) {
          <nwb-map-filter-category [source]="row.items" />
        }
      </div>
    </details>
  `,
  imports: [NwModule, MapFilterCategoryComponent, IconsModule],
  host: {
    class: 'block',
  },
})
export class MapFilterSectionComponent {
  public source = input.required<FilterDataSet[]>()
  protected children = viewChildren(MapFilterCategoryComponent)

  protected data = computed(() => {
    const items = this.source()
    const entries = Object.entries(groupBy(items, (it) => it.category)).map(([category, items]) => {
      return {
        key: category,
        items,
      }
    })

    const rows = sortBy(entries, ({ key }) => key)
    const first = items[0]

    return {
      items,
      rows,
      label: first?.sectionLabel || humanize(first?.section),
      icon: first?.sectionIcon,
    }
  })

  protected items = computed(() => this.data().items)
  protected rows = computed(() => this.data().rows)
  protected label = computed(() => this.data().label)
  protected icon = computed(() => this.data().icon)
  protected isActive = computed(() => {
    return this.children().some((it) => it.isAnyEnabled())
  })
}
