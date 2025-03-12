import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterModule } from '@angular/router'
import { filter } from 'rxjs'
import { DbService } from '~/data/db.service'
import { AppPreferencesService, ItemPreferencesService } from '~/preferences'
import { IconsModule } from '~/ui/icons'
import { svgInfoCircle } from '~/ui/icons/svg'
import { ConfirmDialogComponent, LayoutModule, ModalService } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { HtmlHeadService } from '~/utils'
import { PriceImporterModule } from '~/widgets/price-importer/price-importer.module'
import { DataExportDialogComponent } from './data-export-dialog.component'
import { DataImportDialogComponent } from './data-import-dialog.component'

@Component({
  selector: 'nwb-preferences-page',
  templateUrl: './preferences.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, PriceImporterModule, LayoutModule, RouterModule, IconsModule, TooltipModule],
  host: {
    class: 'ion-page',
  },
})
export class PreferencesComponent {
  protected get collapseMenu() {
    return this.pref.collapseMenuMode.get() == 'always'
  }
  protected set collapseMenu(value: boolean) {
    this.pref.collapseMenuMode.set(value ? 'always' : 'auto')
  }

  protected get highQualityModels() {
    return this.pref.highQualityModels.get()
  }
  protected set highQualityModels(value: boolean) {
    this.pref.highQualityModels.set(value)
  }

  protected get ipfsGateway() {
    return this.pref.ipfsGateway.get()
  }
  protected set ipfsGateway(value: string) {
    this.pref.ipfsGateway.set(value as any)
  }

  protected get gitAccessToken() {
    return this.pref.gitAccessToken.get()
  }
  protected set gitAccessToken(value: string) {
    this.pref.gitAccessToken.set(value as any)
  }

  protected get projectName() {
    return this.pref.projectName.get()
  }
  protected set projectName(value: string) {
    this.pref.projectName.set(value as any)
  }

  protected isDev = false
  protected isDevCount = 0
  protected iconInfo = svgInfoCircle
  public constructor(
    public pref: AppPreferencesService,
    public appDb: DbService,
    private itemPref: ItemPreferencesService,
    private modal: ModalService,
    head: HtmlHeadService,
  ) {
    head.updateMetadata({
      title: 'Preferences',
      description: 'Personal preferences to adjust your New World Buddy experience',
    })
  }

  public async exportPreferences() {
    DataExportDialogComponent.open(this.modal)
  }

  public async importPreferences() {
    DataImportDialogComponent.open(this.modal)
  }

  protected clearPrices() {
    ConfirmDialogComponent.open(this.modal, {
      inputs: {
        title: 'Clear prices',
        body: 'This will clear all previously imported market prices for all items',
        negative: 'Cancel',
        positive: 'Clear',
      },
    })
      .result$.pipe(filter((it) => !!it))
      .subscribe(() => {
        this.itemPref.clearPrices()
        ConfirmDialogComponent.open(this.modal, {
          inputs: {
            title: 'Clear prices',
            body: 'Prices cleared.',
            positive: 'Close',
          },
        })
      })
  }

  protected onHistoryPresetChange(preset: string) {
    switch (preset) {
      case 'nw-buddy-data-live': {
        this.pref.nwDataRepoPreset.set(preset)
        this.pref.nwDataRepo.set('https://github.com/giniedp/nw-buddy-data/tree/main/live/datatables')
        this.pref.nwDataRepoFormat.set('json')
        this.pref.nwDataRepoUseTags.set(true)
        this.pref.nwDataRepoUseFiles.set(true)
        break
      }
      case 'nw-buddy-data-ptr': {
        this.pref.nwDataRepoPreset.set(preset)
        this.pref.nwDataRepo.set('https://github.com/giniedp/nw-buddy-data/tree/main/ptr/datatables')
        this.pref.nwDataRepoFormat.set('json')
        this.pref.nwDataRepoUseTags.set(false)
        this.pref.nwDataRepoUseFiles.set(true)
        break
      }
      case 'new-world-tools-live': {
        this.pref.nwDataRepoPreset.set(preset)
        this.pref.nwDataRepo.set('https://github.com/new-world-tools/datasheets-yaml/tree/main')
        this.pref.nwDataRepoFormat.set('yaml')
        this.pref.nwDataRepoUseTags.set(false)
        this.pref.nwDataRepoUseFiles.set(false)
        break
      }
      default: {
        this.pref.nwDataRepoPreset.set('')
        break
      }
    }
  }
}
