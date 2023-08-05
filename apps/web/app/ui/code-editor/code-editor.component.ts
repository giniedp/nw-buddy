import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostBinding,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core'
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms'
import type * as monaco from 'monaco-editor'

async function loadLibrary() {
  return import('monaco-editor')
}

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
  @Input()
  public language: string = 'typescript'

  @Input()
  public readonly: boolean = false

  @Input()
  @HostBinding('style.min-height.px')
  public minHeight: number = null

  protected onChange = (value: unknown) => {}
  protected onTouched = () => {}
  protected touched = false
  protected value: string

  protected editor: monaco.editor.IStandaloneCodeEditor

  public constructor(private elRef: ElementRef<HTMLElement>, private cdRef: ChangeDetectorRef) {
    //
  }

  public async ngOnInit() {
    const lib = await loadLibrary()
    this.editor = lib.editor.create(this.elRef.nativeElement, {
      value: this.value,
      language: this.language,
      readOnly: this.readonly,
      theme: 'vs-dark',
    })
    this.editor.onDidBlurEditorWidget(() => {
      this.commitValue()
    })
  }

  public ngOnDestroy(): void {
    this.editor.dispose()
  }

  public writeValue(value: string): void {
    this.value = value
    if (this.editor) {
      this.editor.setValue(value)
    }
  }

  public registerOnChange(fn: any): void {
    this.onChange = fn
  }
  public registerOnTouched(fn: any): void {
    this.onTouched = fn
  }
  public setDisabledState(isDisabled: boolean): void {
    this.readonly = isDisabled
    if (this.editor) {
      this.editor.updateOptions({
        readOnly: isDisabled,
      })
    }
  }

  protected commitValue() {
    this.value = this.editor.getValue({ preserveBOM: false, lineEnding: '\n' })
    this.onChange(this.value)
  }
}
