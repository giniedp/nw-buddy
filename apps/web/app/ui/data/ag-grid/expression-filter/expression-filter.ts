import { IDoesFilterPassParams, IFilterComp, IFilterParams } from '@ag-grid-community/core'
import { ExpressionNode, evaluateExpression, isGroup } from '~/ui/expression-tree'

export interface ExpressionFilterParams {
  fields: string[]
  fieldPaths?: string[]
}

export class ExpressionFilter implements IFilterComp {
  public static params(params: ExpressionFilterParams) {
    return params
  }
  private el: HTMLElement

  private params: IFilterParams & ExpressionFilterParams
  private model: ExpressionNode

  public get knownFields() {
    return this.params?.fields
  }

  public get knownPaths() {
    return this.params?.fieldPaths
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
      'gap-2',
    )
  }

  public getGui() {
    return this.el
  }

  public doesFilterPass(params: IDoesFilterPassParams) {
    return evaluateExpression(params.data, this.model)
  }

  public isFilterActive() {
    if (!this.model) {
      return false
    }
    if (this.model.ignore) {
      return false
    }
    if (!isGroup(this.model)) {
      return false
    }
    return this.model.children?.length > 0
  }

  public getModel() {
    return this.model
  }

  public setModel(model: ExpressionNode) {
    this.model = model
  }

  public destroy(): void {
    this.params = null
    this.el = null
  }
}
