export type TypeHint = 'string' | 'color' | 'number' | 'boolean' | 'number[]'

export type Expression = Array<ExpressionValue>
export type Value = string | number | boolean
export type ExpressionValue = Expression | Value

/**
 * fetches a feature property value, similar to feature.get('attributeName')
 * A type hint can optionally be specified, in case the resulting expression contains a type ambiguity which will make it invalid.
 * Type hints can be one of: 'string', 'color', 'number', 'boolean', 'number[]'
 */
function getAttribute(name: string, typeHint?: TypeHint): Expression {
  const result = ['get', name]
  if (typeHint) {
    result.push(typeHint)
  }
  return result
}
/**
 * returns the current resolution
 */
function getResolution(): Expression {
  return ['resolution']
}
/**
 * The time in seconds since the creation of the layer (WebGL only).
 */
function getTime(): Expression {
  return ['time']
}
/**
 * fetches a value from the style variables; will throw an error if that variable is undefined
 */
function getVariable(name: string): Expression {
  return ['var', name]
}
/**
 * The current zoom level (WebGL only).
 */
function getZoom(name: string): Expression {
  return ['var', name]
}

function array(...values: ExpressionValue[]): Expression {
  return values
}

function color({ r, g, b, a }: { r: Expression; g: Expression; b: Expression; a?: Expression }): Expression {
  const result = ['color', r, g, b]
  if (a != null) {
    result.push(a)
  }
  return result
}

export const OL_EXPRESSIONS = {
  getAttribute,
  getResolution,
  getTime,
  getVariable,
  getZoom,
  array,
  color,
}
