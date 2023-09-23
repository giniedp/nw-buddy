import { Dialog, DialogModule } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { Housingitems, ItemDefinitionMaster } from '@nw-data/generated'
import { NwModule } from '~/nw'
import { ItemPreferencesService } from '~/preferences'
import { IconsModule } from '~/ui/icons'
import { svgSackDollar, svgXmark } from '~/ui/icons/svg'
import { JsonPriceImporterComponent } from './json'
import { NwmpPriceImporterComponent } from './nwmp/price-importer-nwmp.component'
import { ComponentStore } from '@ngrx/component-store'
import { getItemId } from '@nw-data/common'
import { ConfirmDialogComponent } from '~/ui/layout'

type ImporterType = 'json' | 'nwmp'

@Component({
  standalone: true,
  selector: 'nwb-price-importer',
  templateUrl: './price-importer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, IconsModule, DialogModule, JsonPriceImporterComponent, NwmpPriceImporterComponent],
  host: {
    class: 'layout-col bg-base-300 rounded-md relative',
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

  public constructor(private dialog: Dialog, private pref: ItemPreferencesService) {
    super({ importer: null, data: null, importing: false })
  }

  protected selectImporter(value: ImporterType) {
    this.patchState({ importer: value, data: null })
  }

  protected close() {
    this.dialog.closeAll()
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
      this.dialog.closeAll()
      ConfirmDialogComponent.open(this.dialog, {
        data: {
          title: 'Import Complete',
          body: 'Prices have been imported.',
          positive: 'Close',
        },
      })
    } catch (e) {
      console.error(e)
      this.dialog.closeAll()
      ConfirmDialogComponent.open(this.dialog, {
        data: {
          title: 'Import Failed',
          html: true,
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
