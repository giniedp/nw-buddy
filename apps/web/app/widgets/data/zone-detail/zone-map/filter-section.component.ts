import { Component, computed, contentChildren, input, viewChildren } from '@angular/core'
import { groupBy, sortBy } from 'lodash'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgToggleLargeOff, svgToggleLargeOn } from '~/ui/icons/svg'
import { humanize } from '~/utils'
import { GameMapLayerDirective } from '~/widgets/game-map'
import { FilterDataSet } from './data/types'
import { MapFilterCategoryComponent } from './filter-category.component'

@Component({
  selector: 'nwb-map-filter-section',
  template: `
    <details [attr.open]="open() || !!search() ? 'open' : null">
      <summary
        class="btn btn-block btn-ghost no-animation rounded-none flex flex-row justify-start items-center group pr-2"
      >
        @if (icon()) {
          <nwb-icon [icon]="icon()" class="w-4" />
        }
        <span class="flex-1 text-start">
          {{ label() | nwText }}
        </span>
        <button
          class="btn btn-square btn-sm bg-opacity-0 border-opacity-0 opacity-0 hover:opacity-100"
          (click)="toggle()"
          [class.text-primary]="isActive()"
          [class.opacity-100]="isActive()"
        >
          <nwb-icon [icon]="isActive() ? iconToggleOn : iconToggleOff" class="w-4" />
        </button>
      </summary>
      <div class="px-2 space-y-1 pt-1 pb-8">
        @for (row of rows(); track row.key) {
          <nwb-map-filter-category [source]="row.items" [search]="search()" />
        }
      </div>
    </details>
  `,
  imports: [NwModule, MapFilterCategoryComponent, IconsModule],
  host: {
    class: 'block',
    '[class.hidden]': '!matchSearch()',
  },
})
export class MapFilterSectionComponent {
  public source = input.required<FilterDataSet[]>()
  public open = input<boolean>()
  public search = input<string>()

  protected children = viewChildren(MapFilterCategoryComponent)
  protected layers = contentChildren(GameMapLayerDirective, { descendants: true })
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
      label: first?.sectionLabel,
      icon: first?.sectionIcon,
    }
  })
  protected matchSearch = computed(() => {
    const search = this.search()
    if (!search) {
      return true
    }
    return this.children().some((it) => it.matchSearch())
  })

  protected items = computed(() => this.data().items)
  protected rows = computed(() => this.data().rows)
  protected label = computed(() => this.data().label)
  protected icon = computed(() => this.data().icon)
  protected iconToggleOn = svgToggleLargeOn
  protected iconToggleOff = svgToggleLargeOff
  protected isActive = computed(() => {
    return this.children().some((it) => it.isAnyEnabled())
  })
  protected toggle() {
    const isActive = this.isActive()
    this.children().forEach((child) => {
      child.layers().forEach((layer) => {
        layer.disabled.set(isActive)
      })
    })
  }
}
