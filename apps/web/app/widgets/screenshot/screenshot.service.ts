import { Dialog } from '@angular/cdk/dialog'
import { ElementRef, Injectable } from '@angular/core'
import { saveAs } from 'file-saver'
import { toBlob } from 'html-to-image'
import { BehaviorSubject } from 'rxjs'
import { ScreenshotSaveDialogComponent } from './screenshot-save-dialog.component'

export interface ScreenshotFrame {
  elementRef: ElementRef<HTMLElement>
  description: string
  width: number
}

@Injectable({ providedIn: 'root' })
export class ScreenshotService {
  public get frames() {
    return this.frames$.value || []
  }
  private set frames(value: ScreenshotFrame[]) {
    this.frames$.next(value)
  }

  private frames$ = new BehaviorSubject<ScreenshotFrame[]>([])

  public constructor(private dialog: Dialog) {}

  public register(frame: ScreenshotFrame) {
    if (this.frames.includes(frame)) {
      return
    }
    this.frames = [...this.frames, frame]
  }

  public unregister(frame: ScreenshotFrame) {
    const frames = this.frames || []
    const index = frames.indexOf(frame)
    if (index < 0) {
      return
    }
    frames.splice(index, 1)
    this.frames$.next([...frames])
  }

  public async makeScreenshot(frame: ScreenshotFrame): Promise<Blob> {
    const el = frame.elementRef.nativeElement
    el.classList.add('screenshot-capture')
    if (frame.width) {
      el.style.width = `${frame.width}px`
    }
    const result = await this.capture(frame).catch((err) => {
      console.error(err)
      return null
    })
    el.classList.remove('screenshot-capture')
    if (frame.width) {
      el.style.width = null
    }
    return result
  }

  public saveBlobToClipoard(blob: Blob) {
    navigator.clipboard.write([
      new ClipboardItem({
        'image/png': blob,
      }),
    ])
  }

  public async saveBlobToFile(blob: Blob, filename: string = 'Screenshot.png') {
    const showSaveFilePicker = window['showSaveFilePicker'] as any
    if (!showSaveFilePicker) {
      return saveAs(blob, filename)
    }

    const handle = await showSaveFilePicker({
      suggestedName: filename,
    })
    if (await verifyPermission(handle)) {
      await writeFile(handle, blob)
    }
  }

  public saveBlobWithDialog(blob: Blob, filename: string = 'Screenshot') {
    ScreenshotSaveDialogComponent.open(this.dialog, {
      data: {
        previewUrl: URL.createObjectURL(blob),
        filename: filename + '.png',
      },
    }).closed.subscribe((result) => {
      if (!result) {
        return
      }
      if (result.action === 'download') {
        this.saveBlobToFile(blob, result.filename)
      }
      if (result.action === 'clipboard') {
        this.saveBlobToClipoard(blob)
      }
    })
  }

  private async capture(frame: ScreenshotFrame) {
    const el = frame.elementRef.nativeElement
    const lazyElements = el.querySelectorAll('[loading=lazy]')
    lazyElements.forEach((it) => {
      it.setAttribute('loading', 'eager')
      it.classList.add('show')
    })
    const hiddenElements = el.querySelectorAll<HTMLElement>('.screenshot-hidden')
    hiddenElements.forEach((it) => {
      it.dataset['screenshotHidden'] = it.style.display
      it.style.display = 'none'
    })
    await new Promise((resolve) => setTimeout(resolve, 1000))
    const result = await toBlob(frame.elementRef.nativeElement)
    lazyElements.forEach((it) => {
      it.setAttribute('loading', 'lazy')
    })
    hiddenElements.forEach((it) => {
      it.style.display = it.dataset['screenshotHidden']
    })
    await new Promise((resolve) => setTimeout(resolve))
    return result
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
