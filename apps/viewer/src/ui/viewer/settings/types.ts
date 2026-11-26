import type { ConfigProperty } from '../../../config'

/**
 * The properties of one group of a config
 */
export interface ConfigGroup {
  title: string
  names: string[]
}

export interface ConfigPanelState {
  /**
   * The properties by group, in the order of the schema
   */
  readonly groups: ConfigGroup[]
}

export interface PropertyRowState {
  readonly property: ConfigProperty
  readonly value: unknown
}

export interface SettingsButtonState {
  /**
   * The dialog is open
   */
  open: boolean
}
