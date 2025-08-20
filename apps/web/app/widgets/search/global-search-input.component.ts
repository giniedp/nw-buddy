import { CdkOverlayOrigin, OverlayModule } from '@angular/cdk/overlay'
import { CommonModule } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  Inject,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ComponentStore } from '@ngrx/component-store'
import { environment } from 'apps/web/environments'
import { debounceTime, merge, switchMap, takeUntil, tap } from 'rxjs'
import { LocaleService } from '~/i18n'
import { IconsModule } from '~/ui/icons'
import { svgMagnifyingGlass, svgXmark } from '~/ui/icons/svg'
import { Hotkeys } from '~/utils'
import { imageFileFromPaste } from '~/utils/image-file-from-paste'
import { useTesseract } from '~/utils/use-tesseract'
import { SEARCH_QUERY_TASKS } from './search-query-tasks'
import type { SearchQueryTasks, SearchRecord } from './search-query.worker'
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
export class GlobalSearchInputComponent
  extends ComponentStore<{ query: string; isPanelOpen: boolean; isLoading: boolean; results: SearchRecord[] }>
  implements OnInit
{
  @ViewChild('input')
  public input: ElementRef<HTMLInputElement>

  @Input()
  public placeholder: string = 'Search'

  public readonly value = this.selectSignal(({ query }) => query)
  public readonly isPanelOpen = this.selectSignal(({ isPanelOpen }) => isPanelOpen)
  public readonly isLoading = this.selectSignal(({ isLoading }) => isLoading)
  public readonly hasResults = this.selectSignal(({ results }) => results?.length > 0)
  public readonly results = this.selectSignal(({ results }) => results)

  protected svgSearch = svgMagnifyingGlass
  protected svgXmark = svgXmark

  public constructor(
    private keys: Hotkeys,
    @Inject(SEARCH_QUERY_TASKS)
    private api: SearchQueryTasks,
    private locale: LocaleService,
    protected cdkOrigin: CdkOverlayOrigin,
    private elRef: ElementRef<HTMLElement>,
  ) {
    super({ query: '', isPanelOpen: true, isLoading: false, results: [] })
  }

  public ngOnInit() {
    merge(this.keys.observe({ keys: 'control./' }), this.keys.observe({ keys: ':' }))
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.input.nativeElement.focus()
      })
    this.select(({ query }) => query)
      .pipe(
        tap((value) => {
          this.patchState({ isLoading: true, isPanelOpen: !!value })
        }),
      )
      .pipe(debounceTime(500))
      .pipe(switchMap((value) => this.search(value)))
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        this.patchState({ isLoading: false, results: result })
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
    this.patchState({ query: value })
  }

  protected async search(value: string) {
    if (!value) {
      return []
    }
    return this.api.search({ text: value, lang: this.locale.value(), nwDataUrl: environment.nwDataUrl })
  }

  protected closePanel() {
    if (this.isPanelOpen()) {
      this.patchState({ isPanelOpen: false })
    }
  }

  protected openPanel() {
    this.patchState({ isPanelOpen: true })
  }

  protected async onFocus() {
    if (this.hasResults()) {
      this.openPanel()
    }
  }

  protected onOutsideClick(e: Event) {
    if (document.activeElement !== this.input.nativeElement) {
      this.closePanel()
    }
  }
}
