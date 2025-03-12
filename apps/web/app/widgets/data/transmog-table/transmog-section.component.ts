import { CommonModule } from '@angular/common'
import { Component, Input } from '@angular/core'
import { NwModule } from '~/nw'
import { VirtualGridComponent } from '~/ui/data/virtual-grid'
import { VirtualGridSectionComponent } from '~/ui/data/virtual-grid/virtual-grid-section.component'
import { IconsModule } from '~/ui/icons'
import { TransmogRecord } from './types'
import { TRANSMOG_CATEGORIES } from '../transmog'

@Component({
  selector: 'nwb-transmog-section',
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
export class TransmogSectionComponent implements VirtualGridSectionComponent {
  @Input()
  public set section(value: string) {
    const [categoryId, subcategory] = value.split('/')
    this.categoryName = TRANSMOG_CATEGORIES.find((it) => it.id === categoryId)?.name
    this.subcategoryName = subcategory
  }

  @Input()
  public count: number

  protected categoryName: string
  protected subcategoryName: string

  public constructor(protected grid: VirtualGridComponent<TransmogRecord>) {
    //
  }
}
