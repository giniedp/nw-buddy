export interface SelectFilterNode<T> {
  type: 'group' | 'value'
}

export interface SelectFilterGroup<T> extends SelectFilterNode<T> {
  type: 'group'
  and?: boolean
  children: Array<SelectFilterNode<T>>
}

export interface SelectFilterValue<T> extends SelectFilterNode<T> {
  type: 'value'
  negate?: boolean
  value: T
}

function isGroup<T>(it: SelectFilterNode<T>): it is SelectFilterGroup<T> {
  return it.type === 'group'
}

function isValue<T>(it: SelectFilterNode<T>): it is SelectFilterValue<T> {
  return it.type === 'value'
}

export function doesFilterPass<T>(model: SelectFilterNode<T>, values: T[]) {
  if (isValue(model)) {
    if (model.negate) {
      return !values.includes(model.value)
    }
    return values.includes(model.value)
  }

  if (isGroup(model)) {
    if (model.and) {
      return model.children.every((child) => doesFilterPass(child, values))
    }
    return model.children.some((child) => doesFilterPass(child, values))
  }

  return false
}
