import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { rxResource } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { RouterModule } from '@angular/router'
import { environment } from 'apps/web/environments'
import { combineLatest, filter } from 'rxjs'
import {
  injectCharactersDB,
  injectGearsetsDB,
  injectItemInstancesDB,
  injectSkillTreesDB,
  injectTablePresetsDB,
} from '~/data'
import { BackendService } from '~/data/backend'
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
  protected backend = inject(BackendService)
  protected signedIn = this.backend.isSignedIn
  protected session = this.backend.session
  private tableChar = injectCharactersDB()
  private tableItems = injectItemInstancesDB()
  private tableTrees = injectSkillTreesDB()
  private tableGears = injectGearsetsDB()
  private tableGrids = injectTablePresetsDB()

  protected envName = environment.environment
  protected version = environment.version
  protected branch = environment.branchname
  protected cdnUrl = environment.cdnUrl
  protected modelsUrl = environment.modelsUrl
  protected tilesUrl = environment.nwTilesUrl

  protected countLocal = rxResource({
    stream: () => {
      return combineLatest({
        characters: this.tableChar.observeWhereCount({ userId: 'local' }),
        items: this.tableItems.observeWhereCount({ userId: 'local' }),
        trees: this.tableTrees.observeWhereCount({ userId: 'local' }),
        gears: this.tableGears.observeWhereCount({ userId: 'local' }),
        grids: this.tableGrids.observeWhereCount({ userId: 'local' }),
      })
    },
    defaultValue: {
      characters: 0,
      items: 0,
      trees: 0,
      gears: 0,
      grids: 0,
    },
  })
  protected countUser = rxResource({
    params: () => this.backend.session()?.id || 'local',
    stream: ({ params }) => {
      return combineLatest({
        characters: this.tableChar.observeWhereCount({ userId: params }),
        items: this.tableItems.observeWhereCount({ userId: params }),
        trees: this.tableTrees.observeWhereCount({ userId: params }),
        gears: this.tableGears.observeWhereCount({ userId: params }),
        grids: this.tableGrids.observeWhereCount({ userId: params }),
      })
    },
    defaultValue: {
      characters: 0,
      items: 0,
      trees: 0,
      gears: 0,
      grids: 0,
    },
  })

  protected get collapseMenu() {
    return this.pref.collapseMenuMode.get() == 'always'
  }
  protected set collapseMenu(value: boolean) {
    this.pref.collapseMenuMode.set(value ? 'always' : 'auto')
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

  public async dropTables() {
    await this.appDb.appDb.dropTables()
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
