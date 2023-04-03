import { Dialog } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterModule } from '@angular/router'
import { filter, take } from 'rxjs'
import { DbService } from '~/data/db.service'
import { AppPreferencesService, ItemPreferencesService, PreferencesService } from '~/preferences'
import { IconsModule } from '~/ui/icons'
import { svgInfoCircle } from '~/ui/icons/svg'
import { ConfirmDialogComponent, LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { HtmlHeadService } from '~/utils'
import { PriceImporterModule } from '~/widgets/price-importer/price-importer.module'
import { DataExportDialogComponent } from './data-export-dialog.component'
import { DataImportDialogComponent } from './data-import-dialog.component'

@Component({
  standalone: true,
  selector: 'nwb-preferences-page',
  templateUrl: './preferences.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, PriceImporterModule, LayoutModule, RouterModule, IconsModule, TooltipModule],
  host: {
    class: 'layout-content layout-pad flex flex-col items-center',
  },
})
export class PreferencesComponent implements OnInit {
  protected get tooltipProvider() {
    return this.app.tooltipProvider.get()
  }
  protected set tooltipProvider(value: string) {
    this.app.tooltipProvider.set(value as any)
  }

  protected get collapseMenu() {
    return this.app.collapseMenuMode.get() == 'always'
  }
  protected set collapseMenu(value: boolean) {
    this.app.collapseMenuMode.set(value ? 'always' : 'auto')
  }
  protected get web3token() {
    return this.app.web3token.get()
  }
  protected set web3token(value: string) {
    this.app.web3token.set(value as any)
  }

  protected get web3gateway() {
    return this.app.web3gateway.get()
  }
  protected set web3gateway(value: string) {
    this.app.web3gateway.set(value as any)
  }

  protected get projectName() {
    return this.app.projectName.get()
  }
  protected set projectName(value: string) {
    this.app.projectName.set(value as any)
  }

  protected iconInfo = svgInfoCircle
  public constructor(
    public app: AppPreferencesService,
    public preferences: PreferencesService,
    public appDb: DbService,
    private itemPref: ItemPreferencesService,
    private dialog: Dialog,
    head: HtmlHeadService
  ) {
    head.updateMetadata({
      title: 'Preferences',
      description: 'Personal preferences to adjust your New World Buddy experience',
    })
  }
  public ngOnInit(): void {}

  public async exportPreferences() {
    DataExportDialogComponent.open(this.dialog, {})
  }

  public async importPreferences() {
    DataImportDialogComponent.open(this.dialog, {})
  }

  protected clearPrices() {
    ConfirmDialogComponent.open(this.dialog, {
      data: {
        title: 'Clear prices',
        body: 'This will clear all previously imported market prices for all items',
        negative: 'Cancel',
        positive: 'Clear',
      },
    })
    .closed
    .pipe(take(1))
    .pipe(filter((it) => !!it))
    .subscribe(() => {
      this.itemPref.clearPrices()
      ConfirmDialogComponent.open(this.dialog, {
        data: {
          title: 'Clear prices',
          body: 'Prices cleared.',
          positive: 'Close',
        },
      })
    })

  }
}
