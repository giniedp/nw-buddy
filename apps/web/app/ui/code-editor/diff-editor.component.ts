import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  HostBinding,
  input,
  Input,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core'
import { loadEditor, monaco } from './monaco-editor'

@Component({
  standalone: true,
  selector: 'nwb-diff-editor',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
  },
})
export class DiffEditorComponent implements OnInit, OnDestroy {
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
    const monaco = await loadEditor()
    this.editor.set(
      monaco.editor.createDiffEditor(this.elRef.nativeElement, {
        readOnly: this.readonly(),
        theme: 'vs-dark',
        automaticLayout: true,
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

    const monaco = await loadEditor()
    editor.setModel({
      original: monaco.editor.createModel(left, language),
      modified: monaco.editor.createModel(right, language),
    })
  }
}
