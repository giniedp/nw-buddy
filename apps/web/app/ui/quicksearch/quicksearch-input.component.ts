import { CommonModule } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { merge } from 'rxjs'
import { Hotkeys } from '~/utils'
import { imageFileFromPaste } from '~/utils/image-file-from-paste'
import { WINDOW } from '~/utils/injection/window'
import { useTesseract } from '~/utils/use-tesseract'
import { IconsModule } from '../icons'
import { svgMagnifyingGlass, svgXmark } from '../icons/svg'
import { QuicksearchService } from './quicksearch.service'

@Component({
  selector: 'nwb-quicksearch-input',
  exportAs: 'quickSearch',
  templateUrl: './quicksearch-input.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, IconsModule],
  host: {
    class: 'block',
  },
})
export class QuicksearchInputComponent {
  private search = inject(QuicksearchService)
  private keys = inject(Hotkeys)
  private isMobile = inject(WINDOW).window.matchMedia('(max-width: 767px)').matches

  public input = viewChild<ElementRef<HTMLInputElement>>('input')

  public placeholder = input<string>('Search')
  public bordered = input<boolean>(true)
  public autofocus = input<boolean>(false)

  protected active = this.search.active
  protected value = this.search.query

  protected svgSearch = svgMagnifyingGlass
  protected svgXmark = svgXmark

  public constructor() {
    merge(this.keys.observe({ keys: 'control.k' }))
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.input().nativeElement.focus()
      })
    if (!this.isMobile) {
      effect(() => {
        if (this.active() && this.autofocus() && this.input()) {
          setTimeout(() => {
            this.input().nativeElement.focus()
          })
        }
      })
    }
  }

  @HostListener('paste', ['$event'])
  protected async onPaste(e: ClipboardEvent) {
    const file = imageFileFromPaste(e)
    if (!file) {
      return
    }
    const tesseract = await useTesseract()
    const url = URL.createObjectURL(file)
    const result = await tesseract.recognize(url)
    const value = result.data.text.split('\n')[0]
    this.submit(value)
  }

  protected submit(value: string) {
    this.search.submit(value)
  }
}
