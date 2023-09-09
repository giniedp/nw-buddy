export interface ControlsGroup {
  label: string
  description?: string
  controls: ControlItem[]
}

export interface ControlItem {
  label: string
  description?: string
  value?: any
  check?: boolean
  action?: () => void
}
