import { createSignal, Show } from 'solid-js'
import { Icon } from 'tweak-ui'
import type { LevelEntry } from '../../../levels/catalog'
import svgWarning from '../../icons/triangle-exclamation.svg?raw'
import { sceneTooltip } from './SceneList.store'

/**
 * A scene of the catalog: its picture, title and subtitle, a tag for the current main menu, a warning for large levels
 */
export function SceneRow(props: {
  entry: LevelEntry
  /**
   * The url of the picture, null for entries without one
   */
  thumbnail: string | null
  current: boolean
  onClick: () => void
}) {
  // the picture is left out when it does not load
  const [failed, setFailed] = createSignal(false)
  return (
    <button
      type="button"
      class="nw-scene-row"
      classList={{ 'nw-scene-row-current': props.current }}
      title={sceneTooltip(props.entry)}
      onClick={props.onClick}
    >
      <span class="nw-scene-thumb" classList={{ 'nw-scene-thumb-icon': !props.entry.image }}>
        <Show when={!failed() && props.thumbnail}>
          {(src) => <img src={src()} alt="" loading="lazy" onError={() => setFailed(true)} />}
        </Show>
      </span>
      <span class="nw-scene-text">
        <span class="nw-scene-title">{props.entry.title}</span>
        <span class="nw-muted">{props.entry.subtitle}</span>
      </span>
      <Show when={props.entry.mainMenu?.active}>
        <span class="nw-scene-tag">current main menu</span>
      </Show>
      <Show when={props.entry.large}>
        <span
          class="nw-scene-warning"
          title={`A large level (${props.entry.memoryMb} MB projected): it loads long and needs a lot of memory`}
        >
          <Icon svg={svgWarning} />
        </span>
      </Show>
    </button>
  )
}
