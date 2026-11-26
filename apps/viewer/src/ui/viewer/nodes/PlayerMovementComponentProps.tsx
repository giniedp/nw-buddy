import { Show } from 'solid-js'
import { SelectWidget, TextWidget, track } from 'tweak-ui'
import { THIRD_PERSON_ENABLED } from '../../../constants'
import type { MovementMode, PlayerMovementComponent } from '../../../game/player/PlayerMovementComponent'
import { usePanel } from '../PanelScope'

const modes: Array<{ value: MovementMode; label: string }> = [
  { value: 'free', label: 'Free (fly)' },
  { value: 'third', label: 'Third person (T)' },
]

export function PlayerMovementComponentProps(props: { data: PlayerMovementComponent }) {
  const panel = usePanel()
  // the mode also changes with the T key
  const mode = track(() => panel.pull(() => props.data.mode), { interval: 250 })
  const setMode = (value: MovementMode) => {
    props.data.mode = value
    panel.redraw()
  }
  if (!THIRD_PERSON_ENABLED) {
    return <TextWidget label="Mode" value="Free (fly)" readonly />
  }
  return (
    <>
      <SelectWidget label="Mode" value={mode()} options={modes} onInput={setMode} />
      <Show when={!panel.pull(() => props.data.canUseThirdPerson)}>
        <TextWidget label="Note" value="third person needs cross origin isolation" readonly />
      </Show>
    </>
  )
}
