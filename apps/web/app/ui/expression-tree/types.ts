export function isGroup(node: ExpressionNode): node is ExpressionGroup {
  return node.type === 'group'
}

export function isCondition(node: ExpressionNode): node is ExpressionCondition {
  return node.type === 'condition'
}

export interface ExpressionNode {
  readonly type: 'group' | 'condition'
  readonly negate: boolean
  readonly operator: string
  readonly ignore: boolean
}

export interface ExpressionGroup extends ExpressionNode {
  readonly type: 'group'
  readonly children: ExpressionNode[]
}

export interface ExpressionCondition extends ExpressionNode {
  readonly type: 'condition'
  readonly field: string
  readonly fieldIsPath: boolean
  readonly value: any
}
