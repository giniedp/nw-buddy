import { ElementRef, Injectable } from '@angular/core'
import { sortBy } from 'lodash'
import { BehaviorSubject } from 'rxjs'
import { ModalService } from '~/ui/layout'
import { injectDocument } from '~/utils/injection/document'
import { injectWindow } from '~/utils/injection/window'
import { isClipboardSupported, saveBlobToClipoard, saveBlobToFile } from '../../utils/file-handling'
import { ScreenshotSaveDialogComponent } from './screenshot-save-dialog.component'
import { cloneElement, getScreenshotOverlay, renderScreenshot } from './utils'

export interface ScreenshotFrame {
  elementRef: ElementRef<HTMLElement>
  name: string
  icon: string
  label: string
  width: number
  mode: 'detached' | 'attached'
}

@Injectable({ providedIn: 'root' })
export class ScreenshotService {
  public get frames() {
    return this.frames$.value || []
  }
  private set frames(value: ScreenshotFrame[]) {
    this.frames$.next(value)
  }

  public get isClipboardSupported() {
    return isClipboardSupported(this.window)
  }

  private document = injectDocument()
  private window = injectWindow()
  private frames$ = new BehaviorSubject<ScreenshotFrame[]>([])

  public constructor(private modal: ModalService) {
    //
  }

  public register(frame: ScreenshotFrame) {
    if (this.frames.includes(frame)) {
      return
    }
    this.frames = sortBy([...this.frames, frame], (it) => it.label || it.name)
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
    const overlay = getScreenshotOverlay(this.document)
    const elOriginal = frame.elementRef.nativeElement
    const el = frame.mode === 'detached' ? detachFrame(elOriginal, overlay) : elOriginal
    el.classList.add('screenshot-capture')
    const result = await this.capture({
      el: el,
      overlay: overlay,
      width: frame.width,
      isDetached: frame.mode === 'detached',
    }).catch((err) => {
      console.error(err)
      return null
    })
    el.classList.remove('screenshot-capture')
    overlay.remove()

    return result
  }

  public saveBlobToClipoard(blob: Blob) {
    return saveBlobToClipoard(blob, 'image/png')
  }

  public async saveBlobToFile(blob: Blob, filename: string = 'Screenshot.png') {
    return saveBlobToFile(blob, filename)
  }

  public saveBlobWithDialog(blob: Blob, filename: string = 'Screenshot') {
    ScreenshotSaveDialogComponent.open(this.modal, {
      inputs: {
        previewUrl: URL.createObjectURL(blob),
        filename: filename + '.png',
        enableClipboard: this.isClipboardSupported,
      },
    }).result$.subscribe((result) => {
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

  private async capture(options: { el: HTMLElement; overlay: HTMLElement; width: number; isDetached: boolean }) {
    const el = options.el
    if (options.width) {
      el.style.width = `${options.width}px`
    }

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
    // HINT: wait for lazy images to load
    await new Promise((resolve) => setTimeout(resolve, 1000))
    const result = renderScreenshot(options).catch((err) => {
      console.error('Failed to capture screenshot', err)
    })

    if (options.width) {
      el.style.width = null
    }
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

function detachFrame(original: HTMLElement, parent: HTMLElement) {
  const result = cloneElement(original)
  parent.appendChild(result)
  return result
}
