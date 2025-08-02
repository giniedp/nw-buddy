import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { rxResource } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { RouterModule } from '@angular/router'
import { environment } from 'apps/web/environments'
import { filter, switchMap } from 'rxjs'
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
import { LOCAL_USER_ID } from '../../../data/constants'

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
  protected pref = inject(AppPreferencesService)
  private dbService = inject(DbService)

  private itemPreferences = inject(ItemPreferencesService)
  private modal = inject(ModalService)

  protected backend = inject(BackendService)
  protected signedIn = this.backend.isSignedIn
  protected session = this.backend.session

  protected envName = environment.environment
  protected version = environment.version
  protected branch = environment.branchname
  protected cdnUrl = environment.cdnUrl
  protected modelsUrl = environment.modelsUrl
  protected tilesUrl = environment.nwTilesUrl

  protected countLocal = rxResource({
    stream: () => this.dbService.userDataStats(LOCAL_USER_ID),
    defaultValue: {
      characters: 0,
      items: 0,
      gearsets: 0,
      presets: 0,
      transmogs: 0,
      skillTrees: 0,
      bookmarks: 0,
    },
  })
  protected countUser = rxResource({
    params: () => this.backend.sessionUserId() || 'local',
    stream: ({ params }) => {
      console.log('count user', params)
      return this.dbService.userDataStats(params)
    },
    defaultValue: {
      characters: 0,
      items: 0,
      gearsets: 0,
      presets: 0,
      transmogs: 0,
      skillTrees: 0,
      bookmarks: 0,
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
  public constructor(head: HtmlHeadService) {
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
    ConfirmDialogComponent.open(this.modal, {
      inputs: {
        title: 'Clear all data',
        body: 'Are you sure you want to clear all data?',
        negative: 'Cancel',
        positive: 'Clear',
      },
    })
      .result$.pipe(
        filter((it) => !!it),
        switchMap(() => this.dbService.clearAllData()),
        switchMap(() => this.dbService.syncUserData()),
      )
      .subscribe({
        next: () => {
          this.modal.showToast({
            message: 'All data cleared.',
            duration: 2000,
            position: 'bottom',
            color: 'success',
          })
        },
        error: (err) => {
          this.modal.showToast({
            message: `There was an error clearing the data: ${err.message}`,
            duration: 2000,
            position: 'bottom',
            color: 'danger',
          })
        },
      })
  }

  public async refreshAccountData() {
    ConfirmDialogComponent.open(this.modal, {
      inputs: {
        title: 'Refresh account data',
        body: 'This will clear your account data on this device and re-fetch it from the server. Any pending data will be lost.',
        negative: 'Cancel',
        positive: 'Refresh now',
      },
    })
      .result$.pipe(
        filter((it) => !!it),
        switchMap(() => this.dbService.clearUserData(this.backend.sessionUserId())),
        switchMap(() => this.dbService.syncUserData()),
      )
      .subscribe({
        next: () => {
          this.modal.showToast({
            message: 'Refresh complete.',
            duration: 2000,
            position: 'bottom',
            color: 'success',
          })
        },
        error: (err) => {
          this.modal.showToast({
            message: `There was an error refreshing the data: ${err.message}`,
            duration: 2000,
            position: 'bottom',
            color: 'danger',
          })
        },
      })
  }

  public async deleteAccountData() {
    ConfirmDialogComponent.open(this.modal, {
      inputs: {
        title: 'Delete account data',
        body: 'Are you sure you want to delete all your account data?',
        negative: 'Cancel',
        positive: 'Delete',
      },
    })
      .result$.pipe(
        filter((it) => !!it),
        switchMap(() => this.dbService.deleteAccountData(this.backend.sessionUserId())),
      )
      .subscribe({
        next: () => {
          this.modal.showToast({
            message: 'All data deleted!',
            duration: 2000,
            position: 'bottom',
            color: 'success',
          })
        },
        error: (err) => {
          this.modal.showToast({
            message: `An error occured while deleting the data: ${err.message}`,
            duration: 2000,
            position: 'bottom',
            color: 'danger',
          })
        },
      })
  }

  public async importToAccount() {
    ConfirmDialogComponent.open(this.modal, {
      inputs: {
        title: 'Import local data',
        body: `
        This will copy all <i class="text-warning">local</i> data to your <i class="text-success">account</i>.
        <br /><br />
        Character progression will be merged with existing character data. Any collision will be overwritten.
        <br /><br />
        Gearsets, skill trees etc. will be created as <span class="text-error">new records<span>.
        `,
        isHtml: true,
        negative: 'Cancel',
        positive: 'Import',
      },
    })
      .result$.pipe(
        filter((it) => !!it),
        switchMap(() => {
          return this.modal.withLoadingIndicator(
            {
              message: 'Importing ...',
              keyboardClose: false,
            },
            () => {
              return this.dbService.importToAccount(this.backend.sessionUserId())
            },
          )
        }),
      )
      .subscribe({
        next: () => {
          this.modal.showToast({
            message: 'All data cleared.',
            duration: 2000,
            position: 'bottom',
            color: 'success',
          })
        },
        error: (err) => {
          this.modal.showToast({
            message: `There was an error clearing the data: ${err.message}`,
            duration: 2000,
            position: 'bottom',
            color: 'danger',
          })
        },
      })
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
      .result$.pipe(
        filter((it) => !!it),
        switchMap(async () => this.itemPreferences.clearPrices()),
      )
      .subscribe({
        next: () => {
          this.modal.showToast({
            message: 'Prices cleared.',
            duration: 2000,
            position: 'bottom',
            color: 'success',
          })
        },
        error: (err) => {
          this.modal.showToast({
            message: `There was an error clearing the data: ${err.message}`,
            duration: 2000,
            position: 'bottom',
            color: 'danger',
          })
        },
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
