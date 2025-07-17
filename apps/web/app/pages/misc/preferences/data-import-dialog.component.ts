import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, HostListener } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { convertImportData } from '~/data'
import { DbService } from '~/data/db.service'
import { NwModule } from '~/nw'
import { PreferencesService } from '~/preferences'
import { IconsModule } from '~/ui/icons'
import { svgCircleCheck, svgCircleExclamation, svgCircleNotch, svgFileImport, svgInfoCircle } from '~/ui/icons/svg'
import { LayoutModule, ModalRef, ModalService } from '~/ui/layout'

export interface DataImportDialogState {
  active?: boolean
  file?: File
  error?: boolean
  complete?: boolean
}

@Component({
  selector: 'nwb-data-import-dialog',
  templateUrl: './data-import-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, IconsModule, LayoutModule],
  host: {
    class: 'ion-page bg-base-100 border border-base-100 rounded-md',
  },
})
export class DataImportDialogComponent extends ComponentStore<DataImportDialogState> {
  public static open(modal: ModalService) {
    return modal.open({
      size: 'sm',
      content: DataImportDialogComponent,
    })
  }

  protected iconInfo = svgInfoCircle
  protected iconError = svgCircleExclamation
  protected iconSuccess = svgCircleCheck
  protected iconSpinner = svgCircleNotch
  protected iconImport = svgFileImport
  protected vm$ = this.state$
  public constructor(
    public preferences: PreferencesService,
    public appDb: DbService,
    private modalRef: ModalRef,
  ) {
    super({
      //
    })
  }

  protected close() {
    this.modalRef.close()
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
    const result = await convertImportData(data)
    this.preferences.import(result.preferences)
    await this.appDb.import(result.database)
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
