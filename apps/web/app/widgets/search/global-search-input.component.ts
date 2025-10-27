import { CdkOverlayOrigin, OverlayModule } from '@angular/cdk/overlay'
import { CommonModule } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  input,
  viewChild,
} from '@angular/core'
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { patchState, signalState } from '@ngrx/signals'
import { environment } from 'apps/web/environments'
import { debounceTime, merge, switchMap, tap } from 'rxjs'
import { LocaleService } from '~/i18n'
import { IconsModule } from '~/ui/icons'
import { svgMagnifyingGlass, svgXmark } from '~/ui/icons/svg'
import { Hotkeys } from '~/utils'
import { imageFileFromPaste } from '~/utils/image-file-from-paste'
import { useTesseract } from '~/utils/use-tesseract'
import { SEARCH_QUERY_TASKS } from './search-query-tasks'
import type { SearchRecord } from './search-query.worker'
import { SearchResultsPanelComponent } from './search-results-panel.component'

@Component({
  selector: 'nwb-global-search-input',
  exportAs: 'quickSearch',
  templateUrl: './global-search-input.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, IconsModule, OverlayModule, SearchResultsPanelComponent],
  hostDirectives: [CdkOverlayOrigin],
  host: {
    class: 'block',
  },
})
export class GlobalSearchInputComponent {
  private keys = inject(Hotkeys)
  private api = inject(SEARCH_QUERY_TASKS)
  private locale = inject(LocaleService)
  protected cdkOrigin = inject(CdkOverlayOrigin)

  private state = signalState<{ query: string; isPanelOpen: boolean; isLoading: boolean; results: SearchRecord[] }>({
    query: '',
    isLoading: false,
    isPanelOpen: false,
    results: [],
  })

  public input = viewChild<string, ElementRef<HTMLInputElement>>('input', { read: ElementRef })

  public placeholder = input<string>('Search')

  public readonly value = this.state.query
  public readonly isPanelOpen = this.state.isPanelOpen
  public readonly isLoading = this.state.isLoading
  public readonly results = this.state.results
  public readonly hasResults = computed(() => !!this.results()?.length)

  protected svgSearch = svgMagnifyingGlass
  protected svgXmark = svgXmark

  public constructor() {
    merge(this.keys.observe({ keys: 'control./' }), this.keys.observe({ keys: ':' }))
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.input().nativeElement.focus()
      })

    toObservable(this.value)
      .pipe(
        tap((value) => {
          patchState(this.state, { isLoading: true, isPanelOpen: !!value })
        }),
      )
      .pipe(debounceTime(500))
      .pipe(switchMap((value) => this.search(value)))
      .pipe(takeUntilDestroyed())
      .subscribe((result) => {
        patchState(this.state, { isLoading: false, results: result })
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
    patchState(this.state, { query: value })
  }

  protected async search(value: string) {
    if (!value) {
      return []
    }
    return this.api.search({ text: value, lang: this.locale.value(), nwDataUrl: environment.nwDataUrl })
  }

  protected closePanel() {
    patchState(this.state, { isPanelOpen: false })
  }

  protected openPanel() {
    patchState(this.state, { isPanelOpen: true })
  }

  protected async onFocus() {
    if (this.hasResults()) {
      this.openPanel()
    }
  }

  protected onOutsideClick(e: Event) {
    if (document.activeElement !== this.input().nativeElement) {
      this.closePanel()
    }
  }
}
