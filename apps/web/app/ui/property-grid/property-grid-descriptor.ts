import { PropertyGridCell } from './property-grid-cell.directive'
import { PropertyGridEntry } from './property-grid-entry'

export type PropertyGridDescriptorFn<T, K extends keyof T = keyof T> = (
  value: T[K],
  key?: K,
  type?: PropertyGridEntry['valueType'],
) => PropertyGridCell | PropertyGridCell[]

export type PropertyGridDescriptorSpec<T> = {
  [K in keyof T]?: PropertyGridDescriptorFn<T, K>
}

export function gridDescriptor<T>(
  spec: PropertyGridDescriptorSpec<T>,
  fallback?: PropertyGridDescriptorFn<T>,
): PropertyGridDescriptorFn<T> {
  return (value: T[keyof T], key: keyof T) => {
    if (spec && key in spec) {
      return spec[key](value, key)
    }
    if (fallback) {
      return fallback(value, key)
    }
    return [{ value: String(value) }]
  }
}
