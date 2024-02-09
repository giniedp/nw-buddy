import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { getItemId } from '@nw-data/common'
import { Housingitems, ItemDefinitionMaster } from '@nw-data/generated'
import { NwModule } from '~/nw'
import { ItemPreferencesService } from '~/preferences'
import { IconsModule } from '~/ui/icons'
import { svgSackDollar, svgXmark } from '~/ui/icons/svg'
import { ConfirmDialogComponent, ModalService } from '~/ui/layout'
import { JsonPriceImporterComponent } from './json'
import { NwmpPriceImporterComponent } from './nwmp/price-importer-nwmp.component'

type ImporterType = 'json' | 'nwmp'

@Component({
  standalone: true,
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
  data: Array<{ item: ItemDefinitionMaster | Housingitems; price: number }>
  importing: boolean
}> {
  protected iconClose = svgXmark
  protected iconDollar = svgSackDollar

  protected isJson$ = this.selectSignal(({ importer }) => importer === 'json')
  protected isNWMP$ = this.selectSignal(({ importer }) => importer === 'nwmp')
  protected importer$ = this.selectSignal(({ importer }) => importer)
  protected data$ = this.selectSignal(({ data }) => data)

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
      this.data$()?.forEach((it) => {
        const itemId = getItemId(it.item)
        if (itemId) {
          this.pref.merge(itemId, {
            price: it.price,
          })
        }
      })
      this.modal.close()
      ConfirmDialogComponent.open(this.modal, {
        inputs: {
          title: 'Import Complete',
          body: 'Prices have been imported.',
          positive: 'Close',
        },
      })
    } catch (e) {
      console.error(e)
      this.modal.close()
      ConfirmDialogComponent.open(this.modal, {
        inputs: {
          title: 'Import Failed',
          isHtml: true,
          body: `
            <p class="text-error mb-1">There was an error while processing the items.</p>
            <pre class="text-xs overflow-auto">${e.stack || e.message}</pre>
          `,
          positive: 'Close',
        },
      })
    }
  }
}
