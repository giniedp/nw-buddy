import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, HostListener, inject, Input, OnInit } from '@angular/core'
import { DomSanitizer } from '@angular/platform-browser'
import { ComponentStore } from '@ngrx/component-store'
import { combineLatest, filter, fromEvent, map, of, switchMap, takeUntil } from 'rxjs'
import { ImagesService } from '~/data'
import { IconsModule } from '~/ui/icons'
import { svgTrashCan } from '~/ui/icons/svg'
import { ConfirmDialogComponent, LayoutModule, ModalOpenOptions, ModalRef, ModalService } from '~/ui/layout'
import { imageFileFromPaste } from '~/utils/image-file-from-paste'
import { injectWindow } from '~/utils/injection/window'

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
  selector: 'nwb-avatar-dialog',
  templateUrl: './avatar-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, IconsModule, LayoutModule],
  host: {
    class: 'ion-page bg-base-100 border border-base-100 rounded-md',
  },
})
export class AvatarDialogComponent extends ComponentStore<AvatarDialogState> implements OnInit {
  private modal = inject(ModalService)
  private modalRef = inject<ModalRef<AvatarDialogResult>>(ModalRef)
  private images = inject(ImagesService)
  private sanitizer = inject(DomSanitizer)

  public static open(modal: ModalService, options: ModalOpenOptions<AvatarDialogComponent>) {
    options.size ??= 'sm'
    options.content = AvatarDialogComponent
    return modal.open<AvatarDialogComponent, AvatarDialogResult>(options)
  }

  @Input()
  public set imageId(id: string) {
    this.patchState({ imageId: id })
  }

  private window = injectWindow()
  protected iconDelete = svgTrashCan
  private maxFileSizeInMb$ = of(1.2)
  private imageId$ = this.select(({ imageId }) => imageId)
  private imageUrl$ = this.imageId$.pipe(switchMap((id) => this.images.imageUrl(id)))
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

  public constructor() {
    super({
      imageId: null,
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
    this.modalRef.close({ imageId })
  }

  protected cancel() {
    this.modalRef.close(null)
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
    ConfirmDialogComponent.open(this.modal, {
      inputs: {
        title: 'Delete image',
        body: 'This will delete the current image from database',
        positive: 'Delete',
        negative: 'Cancel',
      },
    })
      .result$.pipe(filter((it) => !!it))
      .pipe(switchMap(() => this.images.delete(imageId)))
      .subscribe(() => {
        this.patchState({ imageId: null })
        this.modalRef.close({ imageId: null })
      })
  }

  private async createPreviewurl(file: File) {
    if (!file) {
      return null
    }
    const buffer = await file.arrayBuffer()
    const blob = new Blob([buffer], { type: file.type })
    const urlCreator = this.window.URL || this.window.webkitURL
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
    if (oldId) {
      await this.images.delete(oldId).catch(() => null)
    }
    return this.images.create({
      id: null,
      type: file.type,
      data: buffer,
    })
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
