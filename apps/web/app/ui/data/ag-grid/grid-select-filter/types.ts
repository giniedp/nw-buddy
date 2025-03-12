import { IRowNode } from '@ag-grid-community/core'
import type { valueMatcher } from './filter'

export interface GridSelectFilterParams<TData = any> {
  search?: boolean
  condition?: 'and' | 'or'
  getOptions?: (node: IRowNode<TData>) => GridSelectFilterOption[]
  order?: 'asc' | 'desc'
  valueMatcher?: valueMatcher
}

export interface GridSelectFilterOption {
  id: string | number
  label: string
  icon?: string
  order?: number | string
  class?: string[]
  mode?: 'value' | 'range'
}
