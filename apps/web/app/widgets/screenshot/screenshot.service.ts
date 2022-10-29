import { ElementRef, Injectable } from '@angular/core'
import { saveAs } from 'file-saver'
import { toBlob } from 'html-to-image'
import { BehaviorSubject, defer, map } from 'rxjs'

export interface ScreenshotFrame {
  elementRef: ElementRef<HTMLElement>
  description: string
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

  public saveBlobToClipoard(blob: Blob) {
    navigator.clipboard.write([
      new ClipboardItem({
        'image/png': blob,
      }),
    ])
  }

  public saveBlobToFile(blob: Blob, filename: string = 'Screenshot') {
    saveAs(blob, `${filename}.png`)
  }
}
