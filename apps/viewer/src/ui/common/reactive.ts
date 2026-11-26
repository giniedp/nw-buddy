import type { RxJsSubscribable } from '@gglib/utils'
import { createSignal, onCleanup, type Accessor } from 'solid-js'
import type { Config, ConfigSchema, ConfigValues } from '../../config'

/**
 * A signal of a value that is announced by an event: re-read on each event, unsubscribed on cleanup
 *
 * @example
 * ```ts
 * const mode = fromChannel(viewer.onModeChanged, () => viewer.mode)
 * ```
 */
export function fromChannel<T>(channel: RxJsSubscribable<any>, read: () => T): Accessor<T> {
  const [value, setValue] = createSignal(read())

  onCleanup(
    channel.subscribe(() => {
      setValue(() => read())
    }).unsubscribe,
  )

  return value
}

/**
 * A signal of a config value, updated by {@link Config.onChange}
 */
export function configValue<S extends ConfigSchema, K extends keyof S & string>(
  config: Config<S>,
  name: K,
): Accessor<ConfigValues<S>[K]> {
  const [value, setValue] = createSignal(config.value[name])
  onCleanup(config.onChange(name, (it) => setValue(() => it)))
  return value
}
