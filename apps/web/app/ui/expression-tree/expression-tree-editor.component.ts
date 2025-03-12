import { CommonModule } from '@angular/common'
import { Component, Input, inject } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms'
import { distinctUntilChanged, skip } from 'rxjs'
import { ExpressionTreeStore, createGroup } from './expression-tree-editor-store'
import { ExpressionTreeNodeComponent } from './expression-tree-node.component'
import { ExpressionGroup } from './types'
import { isEqual } from 'lodash'

@Component({
  selector: 'nwb-expression-tree-editor',
  templateUrl: './expression-tree-editor.component.html',
  providers: [
    ExpressionTreeStore,
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: ExpressionTreeEditorComponent,
    },
  ],
  imports: [CommonModule, ExpressionTreeNodeComponent],
})
export class ExpressionTreeEditorComponent implements ControlValueAccessor {
  protected readonly store = inject(ExpressionTreeStore)
  protected readonly root$ = this.store.root$

  @Input()
  public set knownFields(value: Array<{ id: string; isPath: boolean; label: string }>) {
    this.store.patchState({ knownFields: value })
  }

  private value: ExpressionGroup
  public constructor() {
    this.store
      .select(({ root }) => root, {
        debounce: true,
      })
      .pipe(skip(1))
      .pipe(takeUntilDestroyed())
      .subscribe((value) => {
        this.value = value as ExpressionGroup
        this.onChange(value)
      })
  }

  protected trackByIndex = (i: number) => i
  protected onChange = (value: unknown) => {}
  protected onTouched = () => {}
  protected touched = false
  protected disabled = false

  public writeValue(value: ExpressionGroup): void {
    this.value = value || createGroup()
    this.store.patchState({
      root: this.value,
    })
  }

  public registerOnChange(fn: any): void {
    this.onChange = fn
  }
  public registerOnTouched(fn: any): void {
    this.onTouched = fn
  }
  public setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled
  }
}
