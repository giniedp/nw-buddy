import { patchPrecision } from '@nw-data/common'
import { EXPRESSION_OPERATORS } from './operators'
import { ExpressionCondition, ExpressionNode, isCondition, isGroup } from './types'

export function evaluateExpression(object: any, expression: ExpressionNode): boolean {
  if (!object || !expression) {
    return false
  }
  if (expression.ignore) {
    return true
  }
  if (isCondition(expression)) {
    const value1 = fixValue(lookupValue(object, expression))
    const value2 = expression.value || ''
    const operator = EXPRESSION_OPERATORS.find((it) => it.id === expression.operator)?.apply
    if (!operator) {
      return false
    }
    const result = operator(value1, value2)
    if (expression.negate) {
      return !result
    }
    return result
  }
  if (isGroup(expression)) {
    const children = expression.children?.filter((it) => !it.ignore)
    if (!children || !Array.isArray(children) || !children.length) {
      return false
    }
    let result = false
    if (expression.operator === 'and') {
      result = children.every((it) => evaluateExpression(object, it))
    } else {
      result = children.some((it) => evaluateExpression(object, it))
    }
    if (expression.negate) {
      return !result
    }
    return result
  }
  return false
}

function fixValue(value: unknown) {
  if (typeof value === 'number') {
    return patchPrecision(value)
  }
  return value
}

function lookupValue(object: any, condition: ExpressionCondition) {
  if (!object || !condition?.field) {
    return null
  }
  if (!condition.fieldIsPath) {
    return object[condition.field]
  }
  const path = condition.field.split('.')
  let result = object
  while (path.length) {
    const key = path.shift()
    result = result?.[key]
  }
  return result
}
