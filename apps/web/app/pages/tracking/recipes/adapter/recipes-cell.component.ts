import { CommonModule } from '@angular/common'
import { Component, Input } from '@angular/core'
import { NwModule } from '~/nw'
import { VirtualGridCellComponent, VirtualGridComponent, VirtualGridOptions } from '~/ui/data/virtual-grid'
import { ItemFrameModule } from '~/ui/item-frame'
import { TooltipModule } from '~/ui/tooltip'
import { EmptyComponent } from '~/widgets/empty'
import { RecipeRecord } from './types'
import { ItemDetailModule } from '~/widgets/data/item-detail'
import { IconsModule } from '~/ui/icons'
import { ItemTrackerModule } from '~/widgets/item-tracker'
import { svgRepeat } from '~/ui/icons/svg'

@Component({
  standalone: true,
  selector: 'nwb-recipes-cell',
  templateUrl: './recipes-cell.component.html',
  styleUrls: ['./recipes-cell.component.scss'],
  imports: [CommonModule, ItemDetailModule, NwModule, IconsModule, ItemTrackerModule, TooltipModule],
  host: {
    class: 'flex m-2',
  },
})
export class RecipeCellComponent implements VirtualGridCellComponent<RecipeRecord> {
  public static buildGridOptions(): VirtualGridOptions<RecipeRecord> {
    return {
      height: 520,
      width: 375,
      cellDataView: RecipeCellComponent,
      cellEmptyView: EmptyComponent,
      getQuickFilterText: (item, tl8) => {
        return [item.item.Name, item.item.Description, item.recipeItem.Name, item.recipeItem.Description]
          .map((it) => tl8(it || ''))
          .join(' ')
      },
    }
  }

  @Input()
  public set data(value: RecipeRecord) {
    this.item = value
    this.showBackside = false
  }

  @Input()
  public selected: boolean

  protected item: RecipeRecord
  protected iconFlip = svgRepeat
  protected showBackside = false

  public constructor(protected grid: VirtualGridComponent<RecipeRecord>) {
    //
  }
}
