import { Dialog, DialogConfig, DialogRef } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, HostListener } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { DbService } from '~/data/db.service'
import { NwModule } from '~/nw'
import { PreferencesService } from '~/preferences'
import { IconsModule } from '~/ui/icons'
import { svgCircleCheck, svgCircleExclamation, svgCircleNotch, svgFileImport, svgInfoCircle } from '~/ui/icons/svg'
import { recursivelyDecodeArrayBuffers } from './buffer-encoding'

export interface DataImportDialogState {
  active?: boolean
  file?: File
  error?: boolean
  complete?: boolean
}

@Component({
  standalone: true,
  selector: 'nwb-data-import-dialog',
  templateUrl: './data-import-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, IconsModule],
  host: {
    class: 'flex flex-col bg-base-100 border border-base-100 rounded-md overflow-hidden h-full w-full',
  },
})
export class DataImportDialogComponent extends ComponentStore<DataImportDialogState> {
  public static open(dialog: Dialog, config: DialogConfig<void>) {
    return dialog.open(DataImportDialogComponent, {
      panelClass: ['max-h-screen', 'w-screen', 'max-w-md', 'layout-pad', 'shadow', 'self-center'],
      ...config,
    })
  }

  protected iconInfo = svgInfoCircle
  protected iconError = svgCircleExclamation
  protected iconSuccess = svgCircleCheck
  protected iconSpinner = svgCircleNotch
  protected iconImport = svgFileImport
  protected vm$ = this.state$
  public constructor(public preferences: PreferencesService, public appDb: DbService, private dialog: DialogRef) {
    super({})
  }

  protected close() {
    this.dialog.close()
  }

  protected async pickFile() {
    const file = await openFile().catch(console.error)
    if (file && isFileValid(file)) {
      this.patchState({ file: file, error: null })
    }
  }

  @HostListener('dragover', ['$event'])
  protected onDragover(e: DragEvent) {
    e.preventDefault()
  }

  @HostListener('drop', ['$event'])
  protected onDrop(e: DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files.item(0)
    if (file && isFileValid(file)) {
      this.patchState({ file: file, error: null })
    }
  }

  protected async import() {
    this.patchState({ active: true })
    const file = this.get(({ file }) => file)
    this.importFile(file)
      .then(() => {
        this.patchState({ active: false, complete: true, error: false })
      })
      .catch((err) => {
        console.error(err)
        this.patchState({ active: false, complete: true, error: true })
      })
  }

  private async importFile(file: File) {
    if (!file) {
      throw new Error('no file given')
    }
    const content = await file.text()
    const data = JSON.parse(content)
    const db = data['db:nw-buddy']
    await recursivelyDecodeArrayBuffers(db)
    console.log(db)
    this.preferences.import(data)
    await this.appDb.import(db)
  }
}

function isFileValid(file?: File | null) {
  return file?.type === 'application/json'
}
async function openFile() {
  return new Promise<File>((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.addEventListener('change', () => {
      resolve(input.files[0])
    })
    input.click()
  })
}
