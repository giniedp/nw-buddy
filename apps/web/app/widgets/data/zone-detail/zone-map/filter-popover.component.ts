import { Component, computed, input, signal } from '@angular/core'
import { PropertyGridModule } from '~/ui/property-grid'
import { LootModule } from '~/widgets/loot'
import { FilterDataSet } from './data/types'

@Component({
  selector: 'nwb-map-filter-popover',
  template: `
    @if (variants().length) {
      <div role="tablist" class="tabs tabs-border">
        @for (item of tabs(); track item.id) {
          <a role="tab" class="tab" [class.tab-active]="item.active" (click)="tab.set(item.id)">{{ item.label }}</a>
        }
      </div>
    }
    @if (lootTable()) {
      <nwb-loot-graph [tableId]="lootTable()" [showLocked]="true" />
    }
  `,
  imports: [PropertyGridModule, LootModule],
  host: {
    class: 'block',
  },
})
export class FilterPopoverComponent {
  public data = input.required<FilterDataSet[]>()
  protected variants = computed(() => {
    if (this.data().length === 1) {
      return this.data()[0].variants
    }
    return []
  })
  protected tab = signal(0)
  protected tabs = computed(() => {
    return this.variants().map((it, i) => {
      return {
        id: i,
        label: it.label,
        active: i === this.tab(),
        variant: it,
      }
    })
  })

  protected variant = computed(() => {
    return this.variants()[this.tab()]
  })

  protected lootTable = computed(() => {
    const tab = this.tabs().find((it) => it.active)
    if (tab) {
      return tab.variant.properties.lootTableID
    }
    return this.data()[0].properties.lootTableID
  })
}
