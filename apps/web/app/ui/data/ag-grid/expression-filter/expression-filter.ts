import { IDoesFilterPassParams, IFilterComp, IFilterParams } from '@ag-grid-community/core'
import { ExpressionNode, evaluateExpression, isGroup } from '~/ui/expression-tree'

export interface ExpressionFilterParams {
  fields: string[]
}

export class ExpressionFilter implements IFilterComp {
  public static params(params: ExpressionFilterParams) {
    return params
  }
  private el: HTMLElement

  private params: IFilterParams & ExpressionFilterParams
  private model: {
    expression: ExpressionNode
    active: boolean
  }

  public get knownFields() {
    return this.params?.fields
  }

  public init(params: IFilterParams & ExpressionFilterParams) {
    this.params = params
    this.el = document.createElement('div')
    this.el.innerHTML = `
      This filter is controlled in the side panel
    `
    this.el.classList.add(
      'rounded-md',
      'min-w-[200px]',
      'bg-base-300',
      'max-h-[50vh]',
      'p-2',
      'flex',
      'flex-col',
      'gap-2'
    )
  }

  public getGui() {
    return this.el
  }

  public doesFilterPass(params: IDoesFilterPassParams) {
    return evaluateExpression(params.data, this.model.expression)
  }

  public isFilterActive() {
    if (!this.model) {
      return false
    }
    if (!this.model.active) {
      return false
    }
    if (!isGroup(this.model.expression)) {
      return false
    }
    return this.model.expression.children.length > 0
  }

  public getModel() {
    return this.model
  }

  public setModel(state: { active: boolean; expression: ExpressionNode }) {
    this.model = state
  }

  public destroy(): void {
    this.params = null
    this.el = null
  }
}
