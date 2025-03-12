import { Injectable } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { isEqual } from 'lodash'
import { EXPRESSION_OPERATORS } from './operators'
import { ExpressionCondition, ExpressionGroup, ExpressionNode, isCondition, isGroup } from './types'
import { signalStore, withState } from '@ngrx/signals'

export interface ExpressionTreeState {
  root: ExpressionNode
  knownFields: Array<{ id: string; isPath: boolean; label: string }>
}

export const GROUP_OPERATORS = ['and', 'or']
export const GROUP_DEFAULT_OPERATOR = GROUP_OPERATORS[0]
export const CONDITION_DEFAULT_OPERATOR = EXPRESSION_OPERATORS[0].id

@Injectable()
export class ExpressionTreeStore extends ComponentStore<ExpressionTreeState> {
  public readonly root$ = this.selectSignal(({ root }) => root || createGroup(), {
    equal: isEqual,
  })

  public readonly groupOperators$ = this.selectSignal(() => GROUP_OPERATORS.map((it) => ({ value: it, label: it })))
  public readonly fieldOperators$ = this.selectSignal(() =>
    EXPRESSION_OPERATORS.map(({ id, label }) => ({ value: id, label: label })),
  )
  public readonly knowFields$ = this.selectSignal(({ knownFields }) => knownFields)

  // private get root() {
  //   return this.get(({ root }) => root)
  // }

  public constructor() {
    super({
      root: createGroup(),
      knownFields: [],
    })
  }

  public updateNode(node: ExpressionNode, modify: (node: ExpressionNode) => ExpressionNode) {
    this.updateTree((current) => {
      if (current === node) {
        return modify(current)
      }
      return current
    })
  }

  public updateTree(modify: (step: ExpressionNode) => ExpressionNode) {
    this.patchState({
      root: modifyTree(this.root$(), modify),
    })
  }

  public removeNode(node: ExpressionNode) {
    if (this.root$() === node) {
      throw new Error('Cannot delete root node')
    }

    this.updateTree((step) => {
      if (isGroup(step)) {
        return {
          ...step,
          children: step.children.filter((it) => it !== node),
        }
      }
      return step
    })
  }

  public setFieldId(node: ExpressionCondition, field: string) {
    const fieldIsPath = !!this.knowFields$().find((it) => it.id === field)?.isPath
    this.updateNode(node, (step) => ({ ...step, fieldIsPath, field }))
  }

  public setOperator(node: ExpressionNode, operator: string) {
    this.updateNode(node, (step) => ({ ...step, operator }))
  }

  public setFieldValue(node: ExpressionCondition, value: string) {
    this.updateNode(node, (step) => ({ ...step, value }))
  }

  public setGroupOperator(node: ExpressionGroup, operator: string) {
    this.updateNode(node, (step) => ({ ...step, operator }))
  }

  public setNegate(node: ExpressionNode, negate: boolean) {
    this.updateNode(node, (step) => ({ ...step, negate }))
  }

  public setIgnore(node: ExpressionNode, ignore: boolean) {
    this.updateNode(node, (step) => ({ ...step, ignore }))
  }

  public addField(parent: ExpressionGroup) {
    this.updateTree((step) => {
      if (isGroup(step) && step === parent) {
        const lastChild = step.children[step.children.length - 1]
        const lastCondition = lastChild && isCondition(lastChild) ? lastChild : null
        const firstField = this.knowFields$()[0]
        return {
          ...step,
          children: [
            createCondition({
              field: lastCondition ? lastCondition.field : firstField?.id,
              fieldIsPath: lastCondition ? lastCondition.fieldIsPath : firstField?.isPath,
              operator: CONDITION_DEFAULT_OPERATOR,
            }),
            ...step.children,
          ],
        }
      }
      return step
    })
  }

  public addGroup(parent: ExpressionGroup) {
    this.updateTree((step) => {
      if (isGroup(step) && step === parent) {
        return {
          ...step,
          children: [
            createGroup({
              operator: GROUP_DEFAULT_OPERATOR,
            }),
            ...step.children,
          ],
        }
      }
      return step
    })
  }
}

function modifyTree(node: ExpressionNode, modify: (step: ExpressionNode) => ExpressionNode) {
  if (!node) {
    return null
  }

  node = modify(node)
  if (isGroup(node) && node.children?.length) {
    ;(node as any).children = node.children.map((it) => modifyTree(it, modify)).filter((it) => !!it)
  }
  return {
    ...node,
  }
}

export function createGroup(options: Partial<ExpressionGroup> = {}): ExpressionGroup {
  return {
    ignore: false,
    negate: false,
    operator: null,
    children: [],
    ...options,
    type: 'group',
  }
}

export function createCondition(options: Partial<ExpressionCondition> = {}): ExpressionCondition {
  return {
    ignore: false,
    negate: false,
    operator: null,
    field: null,
    fieldIsPath: false,
    value: null,
    ...options,
    type: 'condition',
  }
}
