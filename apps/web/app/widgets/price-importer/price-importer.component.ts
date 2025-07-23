import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { getItemId } from '@nw-data/common'
import { HouseItems, MasterItemDefinitions } from '@nw-data/generated'
import { NwModule } from '~/nw'
import { ItemPreferencesService } from '~/preferences'
import { IconsModule } from '~/ui/icons'
import { svgSackDollar, svgXmark } from '~/ui/icons/svg'
import { ModalService } from '~/ui/layout'
import { JsonPriceImporterComponent } from './json'
import { NwmpPriceImporterComponent } from './nwmp/price-importer-nwmp.component'

type ImporterType = 'json' | 'nwmp'

@Component({
  selector: 'nwb-price-importer',
  templateUrl: './price-importer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, IconsModule, JsonPriceImporterComponent, NwmpPriceImporterComponent],
  host: {
    class: 'layout-col bg-base-300 border border-base-100 rounded-md relative',
  },
})
export class PriceImporterComponent extends ComponentStore<{
  importer: ImporterType
  data: Array<{ item: MasterItemDefinitions | HouseItems; price: number }>
  importing: boolean
}> {
  protected iconClose = svgXmark
  protected iconDollar = svgSackDollar

  protected isJson = this.selectSignal(({ importer }) => importer === 'json')
  protected isNWMP = this.selectSignal(({ importer }) => importer === 'nwmp')
  protected importer = this.selectSignal(({ importer }) => importer)
  protected data = this.selectSignal(({ data }) => data)

  public constructor(
    private modal: ModalService,
    private pref: ItemPreferencesService,
  ) {
    super({ importer: null, data: null, importing: false })
  }

  protected selectImporter(value: ImporterType) {
    this.patchState({ importer: value, data: null })
  }

  protected close() {
    this.modal.close()
  }

  protected import() {
    try {
      this.data()?.forEach((it) => {
        const itemId = getItemId(it.item)
        if (itemId) {
          this.pref.merge(itemId, {
            price: it.price,
          })
        }
      })
      this.modal.close()
      this.modal.showToast({
        message: 'Prices successfully imported',
        duration: 3000,
        position: 'bottom',
        color: 'success',
      })
    } catch (e) {
      console.error(e)
      this.modal.close()
      this.modal.showToast({
        message: 'There was an error while importing prices',
        duration: 5000,
        position: 'bottom',
        color: 'error',
      })
    }
  }
}
