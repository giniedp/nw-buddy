import { CommonModule } from '@angular/common'
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { Subject, combineLatest, merge, takeUntil } from 'rxjs'
import { Hotkeys } from '~/utils'
import { imageFileFromPaste } from '~/utils/image-file-from-paste'
import { useTesseract } from '~/utils/use-tesseract'
import { IconsModule } from '../icons'
import { svgMagnifyingGlass, svgXmark } from '../icons/svg'
import { QuicksearchService } from './quicksearch.service'

@Component({
  standalone: true,
  selector: 'nwb-quicksearch-input',
  exportAs: 'quickSearch',
  templateUrl: './quicksearch-input.component.html',
  styleUrls: ['./quicksearch-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, IconsModule],
  host: {
    class: 'relative',
  },
})
export class QuicksearchInputComponent {
  @ViewChild('input')
  public input: ElementRef<HTMLInputElement>

  @Input()
  public placeholder: string = 'Search'

  public readonly value$ = this.search.query$

  protected svgSearch = svgMagnifyingGlass
  protected svgXmark = svgXmark
  protected vm$ = combineLatest({
    active: this.search.active$,
    value: this.search.query$,
  })

  public constructor(private search: QuicksearchService, private keys: Hotkeys) {
    merge(
      this.keys.observe({ keys: '/' }),
      this.keys.observe({ keys: ':' }),
    )
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.input.nativeElement.focus()
      })
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
    this.search.patchState({ value: value })
  }
}
