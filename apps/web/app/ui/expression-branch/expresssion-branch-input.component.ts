import { CdkOverlayOrigin } from '@angular/cdk/overlay'
import { CommonModule } from '@angular/common'
import { Component, Directive, TemplateRef, contentChild, input, signal } from '@angular/core'
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms'
import { IconsModule } from '../icons'
import { svgPlus, svgTrashCan } from '../icons/svg'
import { TreeNodeToggleComponent } from '../tree'

export interface BranchExpression {
  join: string
  rows: BranchExpressionRow[]
}

export interface BranchExpressionRow {
  left: string
  operator: string
  right: string
}

export interface LabelValuePair {
  value: string
  label: string
}

export interface ExpressionBranchCellContext {
  $implicit: string
  index: number
  value: string
}

@Directive({
  standalone: true,
  selector: '[nwbExpressionKey]',
})
export class ExpressionBranchKeyDirective {
  public static ngTemplateContextGuard<T>(
    dir: ExpressionBranchKeyDirective,
    ctx: unknown,
  ): ctx is ExpressionBranchCellContext {
    return true
  }

  public constructor(public readonly template: TemplateRef<ExpressionBranchCellContext>) {}
}

@Directive({
  standalone: true,
  selector: '[nwbExpressionValue]',
})
export class ExpressionBranchValueDirective {
  public static ngTemplateContextGuard<T>(
    dir: ExpressionBranchValueDirective,
    ctx: unknown,
  ): ctx is ExpressionBranchCellContext {
    return true
  }

  public constructor(public readonly template: TemplateRef<ExpressionBranchCellContext>) {}
}

@Component({
  selector: 'nwb-expresssion-branch-input',
  templateUrl: './expresssion-branch-input.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: ExpresssionBranchEditorComponent,
    },
  ],
  imports: [CommonModule, FormsModule, TreeNodeToggleComponent, IconsModule],
  hostDirectives: [CdkOverlayOrigin],
})
export class ExpresssionBranchEditorComponent implements ControlValueAccessor {
  protected onChange = (value: unknown) => {}
  protected onTouched = () => {}

  protected disabled = signal<boolean>(false)
  protected expression = signal<BranchExpression>({
    join: null,
    rows: [],
  })

  public outerOperators = input<LabelValuePair[]>([])
  public innerOperators = input<LabelValuePair[]>([])
  public defaultLeftValue = input<string>(null)
  public defaultRightValue = input<string>(null)
  public deleteIcon = input<string>(svgTrashCan)
  public plusIcon = input<string>(svgPlus)

  public customKey = contentChild(ExpressionBranchKeyDirective, { read: TemplateRef })
  public customValue = contentChild(ExpressionBranchValueDirective, { read: TemplateRef })

  public writeValue(obj: any): void {
    this.expression.set({
      join: obj?.join,
      rows: obj?.rows || [],
    })
  }

  public registerOnChange(fn: any): void {
    this.onChange = fn
  }
  public registerOnTouched(fn: any): void {
    this.onTouched = fn
  }
  public setDisabledState?(isDisabled: boolean): void {
    this.disabled.set(isDisabled)
  }

  protected updateValue(value: BranchExpression) {
    this.expression.set(value)
    this.onChange(value)
  }

  public updateJoinOperator(value: string) {
    this.updateValue({
      ...this.expression(),
      join: value,
    })
  }

  public removeRow(index: number) {
    let { join, rows } = this.expression()
    rows = [...rows]
    rows.splice(index, 1)
    this.updateValue({
      join,
      rows,
    })
  }

  public updateRow(index: number, data: Partial<BranchExpressionRow>) {
    let { join, rows } = this.expression()
    rows = [...rows]
    rows[index] = {
      ...rows[index],
      ...data,
    }
    this.updateValue({
      join,
      rows,
    })
  }

  public addRow() {
    let { join, rows } = this.expression()
    rows = [...rows]
    rows.push({
      ...(rows[rows.length - 1] || {
        left: this.defaultLeftValue(),
        operator: this.innerOperators()[0]?.value,
        right: this.defaultRightValue(),
      }),
    })
    this.updateValue({
      join,
      rows,
    })
  }
}
