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
import { FormsModule } from '@angular/forms'
import { Subject, combineLatest, takeUntil } from 'rxjs'
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
export class QuicksearchInputComponent implements OnInit, OnDestroy {
  @ViewChild('input')
  public input: ElementRef<HTMLInputElement>

  @Input()
  public placeholder: string = 'Search'

  protected svgSearch = svgMagnifyingGlass
  protected svgXmark = svgXmark
  protected vm$ = combineLatest({
    active: this.search.active$,
    value: this.search.query$,
  })

  private destroy$ = new Subject()
  public constructor(private search: QuicksearchService, private keys: Hotkeys, private cdRef: ChangeDetectorRef) {
    //
  }

  public ngOnInit(): void {
    this.keys
      .addShortcut({
        keys: '/',
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.input.nativeElement.focus()
      })
    this.keys
      .addShortcut({
        keys: ':',
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.input.nativeElement.focus()
      })
  }

  public ngOnDestroy(): void {
    this.destroy$.next(null)
    this.destroy$.complete()
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
