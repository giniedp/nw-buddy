import { CommonModule } from '@angular/common'
import { Component } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { DomSanitizer } from '@angular/platform-browser'
import { ActivatedRoute } from '@angular/router'
import { combineLatest, defer, fromEvent, map, switchMap } from 'rxjs'
import { createWorker, recognize } from 'tesseract.js'
import { NwDbService } from '~/nw'
import { observeRouteParam, shareReplayRefCount } from '~/utils'
import { LootModule } from '~/widgets/loot'

@Component({
  standalone: true,
  templateUrl: './tesseract.component.html',
  imports: [CommonModule, LootModule, FormsModule],
  host: {
    class: 'layout-col  p-3',
  },
})
export class DevTesseractComponent {
  protected readonly worker$ = defer(() => {
    return createWorker('eng')
  }).pipe(shareReplayRefCount(1))

  protected readonly paste$ = defer(() => {
    console.log('register paste')
    return fromEvent(document, 'paste')
  })
    .pipe(map(imageFileFromPaste))
    .pipe(shareReplayRefCount(1))

  protected readonly previewImage$ = this.paste$.pipe(
    map((it) => (it ? this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(it)) : null))
  )

  protected readonly recognition = combineLatest({
    worker: this.worker$,
    image: this.paste$,
  }).pipe(
    switchMap(async ({ worker, image }) => {
      const url = URL.createObjectURL(image)

      return recognize(url, null, {})
        .then((res) => {
          console.log({
            words: res.data.words.filter((it) => it.confidence > 80).map((it) => it.text),
            data: res.data,
          })
        })
        .catch(console.error)
    })
  )

  public constructor(private sanitizer: DomSanitizer) {
    this.recognition.subscribe(() => {})
  }
}

function imageFileFromPaste(e: ClipboardEvent) {
  const items = e.clipboardData.items
  for (let i = 0; i < items.length; i++) {
    if (items[i].type.includes('image')) {
      return items[i].getAsFile()
    }
  }
  return null
}
