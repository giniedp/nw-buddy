import { CommonModule } from '@angular/common'
import { Component, Input } from '@angular/core'
import { NwModule } from '~/nw'
import { VirtualGridComponent } from '~/ui/data/virtual-grid'
import { VirtualGridSectionComponent } from '~/ui/data/virtual-grid/virtual-grid-section.component'
import { IconsModule } from '~/ui/icons'
import { InventoryTableRecord } from './inventory-table-cols'
import { INVENTORY_CATEOGRIES } from './utils'

@Component({
  selector: 'nwb-inventory-section',
  template: `
    <h3 class="text-3xl uppercase relative font-caslon text-nw-description p-4">
      {{ categoryName | nwText }} • {{ subcategoryName }}
    </h3>
  `,
  imports: [CommonModule, NwModule, IconsModule],
  host: {
    class: 'flex flex-row items-end m-2 h-full',
  },
})
export class InventorySectionComponent implements VirtualGridSectionComponent {
  @Input()
  public set section(value: string) {
    const [categoryId, subcategory] = value.split('/')
    this.categoryName = categoryId
    this.subcategoryName = subcategory
    const category = INVENTORY_CATEOGRIES.find((it) => it.id === categoryId)
    if (category) {
      this.categoryName = category.name
    }
  }

  @Input()
  public count: number

  protected categoryName: string
  protected subcategoryName: string

  public constructor(protected grid: VirtualGridComponent<InventoryTableRecord>) {
    //
  }
}
