import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  input,
  model,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core'
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms'
import { monaco } from './monaco-editor'
import { MonacoService } from './monaco.service'
@Component({
  standalone: true,
  selector: 'nwb-code-editor',
  template: `
    @if (!editor()) {
      <div class="p-4 text-center">Waiting for editor <span class="loading loading-dots loading-xs"></span></div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: CodeEditorComponent,
    },
  ],
  host: {
    class: 'block',
  },
})
export class CodeEditorComponent implements ControlValueAccessor, OnInit, OnDestroy {
  private service = inject(MonacoService)
  private elRef = inject(ElementRef)
  public language = input<string>(null)
  public theme = input<string>('vs-dark')

  protected onChange = (value: unknown) => {}
  protected onTouched = () => {}
  protected touched = false
  protected value = signal<string>(null)
  protected readonly = signal<boolean>(false)

  public readonly editor = signal<monaco.editor.IStandaloneCodeEditor>(null)

  public constructor() {
    effect(() => {
      this.updateEditor()
    })
  }

  public async ngOnInit() {
    const monaco = await this.service.loadMonaco()
    const editor = monaco.editor.create(this.elRef.nativeElement, {
      value: this.value(),
      language: this.language(),
      readOnly: this.readonly(),
      theme: this.theme(),
      automaticLayout: true,
    })
    this.editor.set(editor)
    editor.onDidBlurEditorWidget(() => this.commitValue())
  }

  public ngOnDestroy(): void {
    this.editor()?.dispose()
  }

  public writeValue(value: string): void {
    this.value.set(value)
  }

  public registerOnChange(fn: any): void {
    this.onChange = fn
  }
  public registerOnTouched(fn: any): void {
    this.onTouched = fn
  }
  public setDisabledState(isDisabled: boolean): void {
    this.readonly.set(isDisabled)
  }

  protected commitValue() {
    const value = this.editor().getValue({ preserveBOM: false, lineEnding: '\n' })
    this.value.set(value)
    this.onChange(value)
  }

  private updateEditor() {
    const editor = this.editor()
    if (!editor) {
      return
    }

    editor.setValue(this.value() || '')
    editor.updateOptions({
      readOnly: this.readonly(),
      theme: this.theme(),
    })
  }
}
