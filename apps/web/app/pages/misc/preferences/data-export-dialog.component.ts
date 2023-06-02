import { Dialog, DialogConfig, DialogModule, DialogRef } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ComponentStore } from '@ngrx/component-store'
import saveAs from 'file-saver'
import { DbService } from '~/data/db.service'
import { SENSITIVE_KEYS } from '~/data/sensitive-keys'
import { NwModule } from '~/nw'
import { AppPreferencesService, PreferencesService } from '~/preferences'
import { IconsModule } from '~/ui/icons'
import { svgCircleCheck, svgCircleExclamation, svgCircleNotch, svgFileExport, svgInfoCircle } from '~/ui/icons/svg'
import { PlatformService } from '~/utils/services/platform.service'
import { recursivelyEncodeArrayBuffers } from './buffer-encoding'
import { EditorDialogComponent } from '~/ui/layout/modal'
import { CodeEditorModule } from '~/ui/code-editor'

export interface DataExportDialogState {
  active?: boolean
  error?: boolean
  complete?: boolean
  publicExport?: boolean
  exportImages?: boolean
}

@Component({
  standalone: true,
  selector: 'nwb-data-export-dialog',
  templateUrl: './data-export-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, IconsModule, FormsModule, CodeEditorModule, DialogModule],
  host: {
    class: 'flex flex-col bg-base-100 border border-base-100 rounded-md overflow-hidden h-full w-full',
  },
})
export class DataExportDialogComponent extends ComponentStore<DataExportDialogState> {
  public static open(dialog: Dialog, config: DialogConfig<void>) {
    return dialog.open(DataExportDialogComponent, {
      panelClass: ['max-h-screen', 'w-screen', 'max-w-md', 'layout-pad', 'shadow', 'self-center'],
      ...config,
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
    private dialogRef: DialogRef,
    private dialog: Dialog,
    private platform: PlatformService
  ) {
    super({})
  }

  protected close() {
    this.dialogRef.close()
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

  public async openIneditor() {
    const publicExport = this.get(({ publicExport }) => publicExport)
    const data = this.preferences.export()
    const db = await this.db.export()
    data['db:nw-buddy'] = db

    await recursivelyEncodeArrayBuffers(data)
    if (publicExport) {
      removeSensitiveKeys(data)
    }

    EditorDialogComponent.open(this.dialog, {
      data: {
        title: '',
        value: JSON.stringify(data, null, 2),
        readonly: true,
        language: 'json',
        positive: 'Close',
      },
    })
  }

  protected async performExport() {
    const publicExport = this.get(({ publicExport }) => publicExport)
    const projectName = this.appPreferences.projectName.get() || 'nw-buddy'
    const suffix = publicExport ? '-pub' : ''
    const fileName = projectName + suffix + '.json'

    const data = this.preferences.export()
    const db = await this.db.export()
    data['db:nw-buddy'] = db

    await recursivelyEncodeArrayBuffers(data)
    if (publicExport) {
      removeSensitiveKeys(data)
    }
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

function removeSensitiveKeys(data: any) {
  if (!data) {
    return
  }

  if (Array.isArray(data)) {
    for (const item of data) {
      removeSensitiveKeys(item)
    }
  } else if (typeof data === 'object') {
    for (const key of SENSITIVE_KEYS) {
      if (key in data) {
        console.log('removed key', key, data[key])
        delete data[key]
      }
    }
    for (const key in data) {
      removeSensitiveKeys(data[key])
    }
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
