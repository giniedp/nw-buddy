import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ComponentStore } from '@ngrx/component-store'
import saveAs from 'file-saver'
import { convertExport, DbService } from '~/data'
import { NwModule } from '~/nw'
import { AppPreferencesService, PreferencesService } from '~/preferences'
import { ClipboardService } from '~/ui/clipboard'
import { CodeEditorModule } from '~/ui/code-editor'
import { IconsModule } from '~/ui/icons'
import { svgCircleCheck, svgCircleExclamation, svgCircleNotch, svgFileExport, svgInfoCircle } from '~/ui/icons/svg'
import { LayoutModule } from '~/ui/layout'
import { ModalRef, ModalService, PromptDialogComponent } from '~/ui/layout/modal'
import { PlatformService } from '~/utils/services/platform.service'

export interface DataExportDialogState {
  active?: boolean
  error?: boolean
  complete?: boolean
  publicExport?: boolean
  exportImages?: boolean
}

@Component({
  selector: 'nwb-data-export-dialog',
  templateUrl: './data-export-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, IconsModule, FormsModule, CodeEditorModule, LayoutModule],
  host: {
    class: 'ion-page bg-base-100 border border-base-100 rounded-md',
  },
})
export class DataExportDialogComponent extends ComponentStore<DataExportDialogState> {
  public static open(modal: ModalService) {
    return modal.open({
      size: ['y-auto', 'x-sm'],
      content: DataExportDialogComponent,
    })
  }

  protected iconInfo = svgInfoCircle
  protected iconError = svgCircleExclamation
  protected iconSuccess = svgCircleCheck
  protected iconSpinner = svgCircleNotch
  protected iconExport = svgFileExport
  protected vm$ = this.state$
  public constructor(
    private db: DbService,
    private appPreferences: AppPreferencesService,
    private preferences: PreferencesService,
    private modalRef: ModalRef,
    private modal: ModalService,
    private platform: PlatformService,
    private clipboard: ClipboardService,
  ) {
    super({})
  }

  protected close() {
    this.modalRef.close()
  }

  public async export() {
    this.patchState({ active: true })
    this.performExport()
      .then(() => {
        this.patchState({
          active: false,
          complete: true,
          error: false,
        })
      })
      .catch((err) => {
        console.error(err)
        this.patchState({
          active: false,
          complete: true,
          error: true,
        })
      })
  }

  public async openJson() {
    const data = convertExport({
      database: await this.db.export(),
      preferences: this.preferences.export(),
      publicExport: this.get(({ publicExport }) => publicExport),
    })
    const json = JSON.stringify(data, null, 2)
    PromptDialogComponent.open(this.modal, {
      inputs: {
        title: 'Data Exported',
        value: json,
        inputType: 'textarea',
        body: 'Copy the data below and save it to a file manually.',
        positive: 'Close',
      },
    })
    this.close()
  }

  protected async performExport() {
    const publicExport = this.get(({ publicExport }) => publicExport)
    const projectName = this.appPreferences.projectName.get() || 'nw-buddy'
    const suffix = publicExport ? '-pub' : ''
    const fileName = projectName + suffix + '.json'

    const data = await convertExport({
      database: await this.db.export(),
      preferences: this.preferences.export(),
      publicExport,
    })

    await downloadJson({
      data,
      fileName,
      usePicker: !(this.platform.isElectron || this.platform.isIframe),
    })
  }
}

async function downloadJson({ data, fileName, usePicker }: { data: any; fileName: string; usePicker: boolean }) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'text/json' })
  const showSaveFilePicker = window['showSaveFilePicker']
  if (!usePicker || !showSaveFilePicker) {
    return saveAs(blob, fileName)
  }
  const handle = await showSaveFilePicker({
    suggestedName: fileName,
    types: [
      {
        description: 'NW Buddy File',
        accept: { 'text/json': ['.json'] },
      },
    ],
  })
  if (await verifyPermission(handle)) {
    await writeFile(handle, blob)
  }
}

async function writeFile(fileHandle, contents: Blob) {
  const writable = await fileHandle.createWritable()
  await writable.write(contents)
  await writable.close()
}
async function verifyPermission(fileHandle) {
  const options = {
    mode: 'readwrite',
  }
  // Check if permission was already granted. If so, return true.
  if ((await fileHandle.queryPermission(options)) === 'granted') {
    return true
  }
  // Request permission. If the user grants permission, return true.
  if ((await fileHandle.requestPermission(options)) === 'granted') {
    return true
  }
  // The user didn't grant permission, so return false.
  return false
}
