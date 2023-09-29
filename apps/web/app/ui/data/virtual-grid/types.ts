export interface VirtualGridSection {
  id: string
  label?: string
  icon?: string
}

export interface SectionGroup<T> {
  section: string
  items: T[]
}
