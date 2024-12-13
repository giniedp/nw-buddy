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
import { loadEditor, monaco } from './monaco-editor'

@Component({
  standalone: true,
  selector: 'nwb-code-editor',
  template: '',
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
  private elRef = inject(ElementRef)
  public language = input<string>(null)
  public theme = input<string>('vs-dark')

  protected onChange = (value: unknown) => {}
  protected onTouched = () => {}
  protected touched = false
  protected value = signal<string>(null)
  protected readonly = signal<boolean>(false)

  protected editor = signal<monaco.editor.IStandaloneCodeEditor>(null)

  public constructor() {
    effect(() => {
      this.updateEditor()
    })
  }

  public async ngOnInit() {
    const monaco = await loadEditor()
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
    editor.setValue(this.value())
    editor.updateOptions({
      readOnly: this.readonly(),
      theme: this.theme(),
    })
  }
}
