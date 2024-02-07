import { DIALOG_DATA, Dialog, DialogConfig, DialogRef } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, HostListener, Inject, OnInit } from '@angular/core'
import { DomSanitizer } from '@angular/platform-browser'
import { ComponentStore } from '@ngrx/component-store'
import { combineLatest, filter, fromEvent, map, of, switchMap, take, takeUntil } from 'rxjs'
import { ImagesDB } from '~/data'
import { IconsModule } from '~/ui/icons'
import { svgTrashCan } from '~/ui/icons/svg'
import { ConfirmDialogComponent } from '~/ui/layout'
import { imageFileFromPaste } from '~/utils/image-file-from-paste'

export interface AvatarDialogOptions {
  imageId?: string
}

export interface AvatarDialogState {
  imageId?: string
  file?: File
}

export interface AvatarDialogResult {
  imageId: string
}

@Component({
  standalone: true,
  selector: 'nwb-avatar-dialog',
  templateUrl: './avatar-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, IconsModule],
  host: {
    class: 'd-block bg-base-100 border border-base-100 rounded-md overflow-hidden',
  },
})
export class AvatarDialogComponent extends ComponentStore<AvatarDialogState> implements OnInit {
  public static open(
    dialog: Dialog,
    config: DialogConfig<AvatarDialogOptions, DialogRef<AvatarDialogResult, AvatarDialogComponent>>,
  ) {
    return dialog.open(AvatarDialogComponent, {
      maxWidth: 400,
      panelClass: ['w-full', 'layout-pad', 'self-end', 'sm:self-center', 'shadow'],
      ...config,
    })
  }
  protected iconDelete = svgTrashCan
  private maxFileSizeInMb$ = of(1.2)
  private imageId$ = this.select(({ imageId }) => imageId)
  private imageUrl$ = this.imageId$.pipe(switchMap((id) => this.imagesDb.imageUrl(id)))
  private file$ = this.select(({ file }) => file)
  private filePreviewUrl$ = this.file$.pipe(switchMap((file) => this.createPreviewurl(file)))

  protected vm$ = combineLatest({
    state: this.state$,
    imageUrl: this.imageUrl$,
    filePreview: this.filePreviewUrl$,
    maxFileSizeInMb: this.maxFileSizeInMb$,
  }).pipe(
    map(({ state, imageUrl, filePreview, maxFileSizeInMb }) => {
      let fileTooLarge = false
      if (state.file) {
        fileTooLarge = state.file.size > 1024 * 1024 * maxFileSizeInMb
      }

      return {
        ...state,
        imageUrl,
        filePreview,
        previewUrl: imageUrl || filePreview,
        fileTooLarge,
        maxFileSizeInMb,
      }
    }),
  )

  public constructor(
    @Inject(DIALOG_DATA)
    private data: AvatarDialogOptions,
    private dialog: Dialog,
    private dialogRef: DialogRef<AvatarDialogResult>,
    private imagesDb: ImagesDB,
    private sanitizer: DomSanitizer,
  ) {
    super({
      imageId: data.imageId,
    })
  }
  public ngOnInit(): void {
    fromEvent(document, 'paste')
      .pipe(takeUntil(this.destroy$))
      .subscribe((e: ClipboardEvent) => {
        const file = imageFileFromPaste(e)
        if (file) {
          this.patchState({ file: file })
        }
      })
  }

  protected async commit(file: File) {
    let imageId = this.get(({ imageId }) => imageId)
    if (file) {
      const image = await this.saveImageFile(file, imageId)
      imageId = image.id
    }
    this.dialogRef.close({ imageId })
  }

  protected cancel() {
    this.dialogRef.close(null)
  }

  protected removeImage() {
    const file = this.get(({ file }) => !!file)
    const imageId = this.get(({ imageId }) => imageId)

    if (file) {
      this.patchState({ file: null })
      return
    }
    if (!imageId) {
      return
    }
    ConfirmDialogComponent.open(this.dialog, {
      data: {
        title: 'Delete image',
        body: 'This will delete the current image from database',
        positive: 'Delete',
        negative: 'Cancel',
      },
    })
      .closed.pipe(take(1))
      .pipe(filter((it) => !!it))
      .pipe(switchMap(() => this.imagesDb.destroy(imageId)))
      .subscribe(() => {
        this.patchState({ imageId: null })
        this.dialogRef.close({ imageId: null })
      })
  }

  private async createPreviewurl(file: File) {
    if (!file) {
      return null
    }
    const buffer = await file.arrayBuffer()
    const blob = new Blob([buffer], { type: file.type })
    const urlCreator = window.URL || window.webkitURL
    const url = urlCreator.createObjectURL(blob)
    return this.sanitizer.bypassSecurityTrustUrl(url)
  }

  protected async pickFile() {
    const file = await openFile().catch(console.error)
    if (file) {
      this.patchState({ file: file })
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
    if (file) {
      this.patchState({ file: file })
    }
  }

  protected async saveImageFile(file: File, oldId: string) {
    const buffer = await file.arrayBuffer()
    const result = await this.imagesDb.db.transaction('rw', this.imagesDb.table, async () => {
      if (oldId) {
        await this.imagesDb.destroy(oldId).catch(() => null)
      }
      return this.imagesDb.create({
        id: null,
        type: file.type,
        data: buffer,
      })
    })
    return result
  }

  // protected showFileTooLargeError() {
  //   ConfirmDialogComponent.open(this.dialog, {
  //     data: {
  //       title: 'File too large',
  //       body: `
  //       Maximum file size is 1MB. Reduce image resolution or use an
  //       <a href="https://www.google.com/search?q=online+image+optimizer" target="_blank" tabindex="-1" class="link">image optimizer</a>
  //       `,
  //       html: true,
  //       positive: 'OK',
  //     },
  //   })
  // }
}

async function openFile() {
  return new Promise<File>((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.addEventListener('change', () => {
      resolve(input.files[0])
    })
    input.click()
  })
}
