import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  HostBinding,
  inject,
  input,
  Input,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core'
import { monaco } from './monaco-editor'
import { MonacoService } from './monaco.service'

@Component({
  standalone: true,
  selector: 'nwb-diff-editor',
  template: `
    @if (!editor()) {
      <div class="p-4 text-center">Waiting for editor <span class="loading loading-dots loading-xs"></span></div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
  },
})
export class DiffEditorComponent implements OnInit, OnDestroy {
  private service = inject(MonacoService)
  public language = input<string>(null)
  public readonly = input<boolean>(false)
  public leftValue = input<string>(null)
  public rightValue = input<string>(null)

  @Input()
  @HostBinding('style.min-height.px')
  public minHeight: number = null

  protected editor = signal<monaco.editor.IStandaloneDiffEditor>(null)

  public constructor(private elRef: ElementRef<HTMLElement>) {
    effect(() => {
      this.updateContent()
    })
  }

  public async ngOnInit() {
    const monaco = await this.service.loadMonaco()
    this.editor.set(
      monaco.editor.createDiffEditor(this.elRef.nativeElement, {
        readOnly: this.readonly(),
        theme: 'vs-dark',
        automaticLayout: true,
        renderSideBySide: false,
        hideUnchangedRegions: {
          enabled: true,
        },
      }),
    )
  }

  public ngOnDestroy(): void {
    this.editor()?.dispose()
  }

  protected async updateContent() {
    const editor = this.editor()
    const left = this.leftValue()
    const right = this.rightValue()
    const language = this.language()
    if (!editor) {
      return
    }

    const monaco = await this.service.loadMonaco()
    editor.setModel({
      original: monaco.editor.createModel(left, language),
      modified: monaco.editor.createModel(right, language),
    })
  }
}
