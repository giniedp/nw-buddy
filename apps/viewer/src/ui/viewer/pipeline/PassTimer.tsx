import type { Device } from '@gglib/graphics'
import type { RenderPass } from '@gglib/render'
import { Show } from 'solid-js'
import { BoolWidget, PollWidget } from 'tweak-ui'
import { createPassTimerStore } from './PassTimer.store'

/**
 * Toggles the GPU timer of a pass and shows its times
 */
export function PassTimer(props: { pass: RenderPass; device: Device }) {
  const store = createPassTimerStore(props)
  return (
    <>
      <BoolWidget label="GPU timer" value={store.state.enabled} onInput={store.setEnabled} />
      <Show when={store.state.enabled}>
        <PollWidget label="GPU ms" value={store.times()} />
      </Show>
    </>
  )
}
