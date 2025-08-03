import { CommonModule } from '@angular/common'
import { Component, Input } from '@angular/core'
import { NwModule } from '~/nw'
import { VirtualGridCellComponent, VirtualGridComponent, VirtualGridOptions } from '~/ui/data/virtual-grid'
import { ItemFrameModule } from '~/ui/item-frame'
import { TooltipModule } from '~/ui/tooltip'
import { EmptyComponent } from '~/widgets/empty'
import { SchematicRecord } from './types'
import { ItemDetailModule } from '~/widgets/data/item-detail'
import { IconsModule } from '~/ui/icons'
import { ItemTrackerModule } from '~/widgets/item-tracker'
import { svgRepeat } from '~/ui/icons/svg'
import { CraftingCalculatorComponent } from '~/widgets/crafting'

@Component({
  selector: 'nwb-schematic-cell',
  templateUrl: './schematic-cell.component.html',
  styleUrls: ['./schematic-cell.component.scss'],
  imports: [
    CommonModule,
    ItemDetailModule,
    NwModule,
    IconsModule,
    ItemTrackerModule,
    TooltipModule,
    CraftingCalculatorComponent,
  ],
  host: {
    class: 'flex m-2',
  },
})
export class SchematicCellComponent implements VirtualGridCellComponent<SchematicRecord> {
  public static buildGridOptions(): VirtualGridOptions<SchematicRecord> {
    return {
      height: 400,
      width: 400,
      cellDataView: SchematicCellComponent,
      cellEmptyView: EmptyComponent,
      getQuickFilterText: (item, tl8) => {
        return [item.item.Name, item.item.Description, item.recipeItem.Name, item.recipeItem.Description]
          .map((it) => tl8(it || ''))
          .join(' ')
      },
    }
  }

  public static buildGridOptionsWeapons(): VirtualGridOptions<SchematicRecord> {
    return {
      ...SchematicCellComponent.buildGridOptions(),
      height: 650,
      width: 400,
    }
  }

  @Input()
  public set data(value: SchematicRecord) {
    this.item = value
    this.showBackside = false
  }

  @Input()
  public selected: boolean

  protected item: SchematicRecord
  protected iconFlip = svgRepeat
  protected showBackside = false

  public constructor(protected grid: VirtualGridComponent<SchematicRecord>) {
    //
  }
}
