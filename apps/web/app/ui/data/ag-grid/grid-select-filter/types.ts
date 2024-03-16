import { IRowNode } from "@ag-grid-community/core"

export interface GridSelectFilterParams<TData = any> {
  search?: boolean
  condition?: 'and' | 'or'
  getOptions?: (node: IRowNode<TData>) => GridSelectFilterOption[]
  order?: 'asc' | 'desc'
}

export interface GridSelectFilterOption {
  id: string | number
  label: string
  icon?: string
  order?: number | string
  class?: string[]
}
