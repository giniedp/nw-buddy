import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal, resource } from '@angular/core'
import { DyeColorData } from '@nw-data/generated'
import { groupBy } from 'lodash'
import tinycolor from 'tinycolor2'
import { injectNwData } from '~/data'
import { NwModule } from '~/nw'
import { LayoutModule, ModalOpenOptions, ModalRef, ModalService } from '~/ui/layout'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { TooltipModule } from '~/ui/tooltip'
import { ItemDetailModule } from '../data/item-detail'
export interface DyePickerDialogData {
  colors: DyeColorData[]
  color: DyeColorData
}

@Component({
  selector: 'nwb-dye-picker',
  templateUrl: './dye-picker.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, TooltipModule, LayoutModule, QuicksearchModule, ItemDetailModule],
  providers: [QuicksearchService],
  host: {
    class: 'ion-page bg-base-100 border border-base-100 rounded-md',
  },
})
export class DyePickerComponent {
  public static open(modal: ModalService, options: ModalOpenOptions<DyePickerComponent>) {
    options.content = DyePickerComponent
    return modal.open<DyePickerComponent, DyeColorData>(options)
  }
  private modalRef = inject(ModalRef<DyeColorData>)
  private quicksearch = inject(QuicksearchService)
  private db = injectNwData()
  private items = resource({
    loader: () => this.db.dyeItemsByIndexMap(),
  })

  public color = input<DyeColorData>()
  protected selection = linkedSignal(this.color)

  public colors = input<DyeColorData[]>()

  protected colorItemPairs = computed(() => {
    const items = this.items.value()
    return this.colors().map((color) => {
      return {
        ...color,
        item: items?.get(color.Index),
      }
    })
  })

  public displayColors = computed(() => {
    const query = this.quicksearch.query().toLowerCase()
    if (!query) {
      return this.colorItemPairs()
    }
    return this.colorItemPairs().filter((it) => {
      const name = (it.Name || '').toLowerCase()
      const category = (it.Category || '').toLowerCase()
      return name.includes(query) || category.toLowerCase().includes(query)
    })
  })
  public groups = computed(() => {
    const groups = groupBy(this.displayColors(), (it) => {
      return (it.Category || '').toLowerCase().trim()
    })
    const result = Object.keys(groups).map((category) => {
      const colors = groups[category]
      return {
        category,
        colors: colors.sort((a, b) => {
          const hslA = tinycolor(a.Color).toHsl()
          const hslB = tinycolor(b.Color).toHsl()

          const al = Math.floor(hslA.l * 100)
          const bl = Math.floor(hslB.l * 100)
          if (al !== bl) {
            return al - bl
          }
          const as = Math.floor(hslA.s * 100)
          const bs = Math.floor(hslB.s * 100)
          if (as !== bs) {
            return as - bs
          }
          return 0
        }),
      }
    })
    result.sort((a, b) => {
      const al = a.category.toLowerCase()
      const bl = b.category.toLowerCase()
      return al.localeCompare(bl)
    })
    return result
  })

  protected isSelected(color: DyeColorData) {
    return this.selection()?.Index === color?.Index
  }

  protected select(color: DyeColorData) {
    if (this.isSelected(color)) {
      this.selection.set(null)
    } else {
      this.selection.set(color)
    }
  }

  protected commit(color = this.selection()) {
    if (color) {
      color = { ...color }
      delete color['item']
    }
    this.modalRef.close(color)
  }

  protected cancel() {
    this.modalRef.close()
  }
}
