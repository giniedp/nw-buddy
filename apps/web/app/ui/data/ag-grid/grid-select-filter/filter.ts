export interface SelectFilterNode<T> {
  type: 'group' | 'value'
  negate?: boolean
}

export interface SelectFilterGroup<T> extends SelectFilterNode<T> {
  type: 'group'
  and?: boolean
  children: Array<SelectFilterNode<T>>
}

export interface SelectFilterValue<T> extends SelectFilterNode<T> {
  type: 'value'
  value: T
  data?: any
}

export function isGroup<T>(it: SelectFilterNode<T>): it is SelectFilterGroup<T> {
  return it.type === 'group'
}

export function isValue<T>(it: SelectFilterNode<T>): it is SelectFilterValue<T> {
  return it.type === 'value'
}

export function valueNode<T>(value: T): SelectFilterValue<T> {
  return {
    type: 'value',
    value: value,
  }
}

export function groupNode<T>(children: Array<SelectFilterNode<T>>): SelectFilterGroup<T> {
  return {
    type: 'group',
    children: children,
  }
}

export type valueMatcher = <T>(value: SelectFilterValue<T>, values: T[]) => boolean
function defaultMatcher<T>(value: SelectFilterValue<T>, values: T[]) {
  return values.includes(value.value)
}
export function evaluateFilter<T>(model: SelectFilterNode<T>, values: T[], valueMatcher?: valueMatcher) {
  if (isValue(model)) {
    let result = (valueMatcher || defaultMatcher)(model, values)
    if (model.negate) {
      result = !result
    }
    return result
  }

  if (isGroup(model)) {
    let result = false
    if (model.and) {
      result = model.children.every((child) => evaluateFilter(child, values, valueMatcher))
    } else {
      result = model.children.some((child) => evaluateFilter(child, values, valueMatcher))
    }
    if (model.negate) {
      result = !result
    }
    return result
  }

  return false
}

export function toggleValue<T>(state: SelectFilterGroup<T>, value: T): SelectFilterGroup<T> {
  if (!isGroup(state)) {
    return state
  }
  const group = { ...state }
  const children = group.children.filter((it) => !isValue(it) || it.value !== value)
  if (state.children?.length !== children?.length) {
    return {
      ...state,
      children: children,
    }
  }
  return {
    ...state,
    children: [...(children || []), valueNode(value)],
  }
}

export function setValueData<T>(state: SelectFilterGroup<T>, value: T, data: any): SelectFilterGroup<T> {
  if (!isGroup(state)) {
    return state
  }
  const group = { ...state }
  return {
    ...state,
    children: group.children.map((child) => {
      if (isValue(child) && child.value === value) {
        return {
          ...child,
          data,
        }
      }
      return child
    }),
  }
}

export function toggleValueNegation<T>(state: SelectFilterNode<T>, value: T): SelectFilterNode<T> {
  if (isGroup(state)) {
    return {
      ...state,
      children: state.children?.map((it) => toggleValueNegation(it, value)),
    } as SelectFilterGroup<T>
  }
  if (isValue(state)) {
    return {
      ...state,
      negate: state.value === value ? !state.negate : state.negate,
    } as SelectFilterValue<T>
  }
  return state
}
