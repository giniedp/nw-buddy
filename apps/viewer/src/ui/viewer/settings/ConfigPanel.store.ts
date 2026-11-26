import { createMemo, createSignal, onCleanup } from 'solid-js'
import { createStore } from 'solid-js/store'
import type { Config, ConfigSchema } from '../../../config'
import { configValue } from '../../common/reactive'
import { configGroups } from './config'
import type { ConfigPanelState, PropertyRowState } from './types'

export type ConfigPanelStore = ReturnType<typeof createConfigPanelStore>
export type PropertyRowStore = ReturnType<typeof createPropertyRowStore>

/**
 * The properties of a config by group, and whether each one applies with the current values
 */
export function createConfigPanelStore(props: { config: Config<ConfigSchema> }) {
  const groups = createMemo(() => configGroups(props.config.schema, props.config.names))
  const [state] = createStore<ConfigPanelState>({
    get groups() {
      return groups()
    },
  })
  // counts the changes of any property: the availability depends on other properties
  const [revision, setRevision] = createSignal(0)
  for (const name of props.config.names) {
    onCleanup(props.config.onChange(name, () => setRevision((it) => it + 1)))
  }
  return {
    state,
    /**
     * Whether the property applies with the current values ({@link ConfigProperty.available})
     */
    available(name: string): boolean {
      revision()
      const rule = props.config.schema[name].available
      return !rule || rule(props.config.value)
    },
  }
}

/**
 * One property of a config: its value, updated by the config's change events. Changes are saved right away.
 */
export function createPropertyRowStore(props: { config: Config<ConfigSchema>; name: string }) {
  const value = configValue(props.config, props.name)
  const [state] = createStore<PropertyRowState>({
    get property() {
      return props.config.schema[props.name]
    },
    get value() {
      return value()
    },
  })
  return {
    state,
    set(next: unknown) {
      if (props.config.set(props.name, next as never)) {
        props.config.save()
      }
    },
  }
}
