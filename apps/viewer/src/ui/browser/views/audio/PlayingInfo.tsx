import { Show } from 'solid-js'
import { Button } from 'tweak-ui'
import { formatDuration, type Playback } from './playback'

/**
 * What plays, from any audio view: id and position, and a stop button
 */
export function PlayingInfo(props: { playback: Playback }) {
  const state = () => props.playback.state
  return (
    <Show when={state().key}>
      <span class="nw-view-info nw-push-end">
        {`${state().name} · ${formatDuration(state().position)} / ${formatDuration(state().duration)} · ${state().channels} ch `}
        <Button ghost onClick={props.playback.stop}>
          Stop
        </Button>
      </span>
    </Show>
  )
}
