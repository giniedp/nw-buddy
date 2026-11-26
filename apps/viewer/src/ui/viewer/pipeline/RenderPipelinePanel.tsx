import type { Device } from '@gglib/graphics'
import { FunctionPass, GroupPass, type RenderPass, type RenderPipeline } from '@gglib/render'
import { For, Show } from 'solid-js'
import { BoolWidget, Group } from 'tweak-ui'
import { getPassInfo } from '../../../graphics/PassInfo'
import { usePanel } from '../PanelScope'
import { PassFields } from './passFields'
import { PassTimer } from './PassTimer'
import './RenderPipelinePanel.css'

/**
 * The render pipeline as a tree of the passes that run:
 * - only passes the frame works without (marked optional by the pipeline, see graphics/PassInfo) can be turned off
 * - input passes are listed read only
 */
export function RenderPipelinePanel(props: { pipeline: RenderPipeline | null | undefined; device: Device }) {
  const panel = usePanel()
  return <PassList passes={panel.pull(() => props.pipeline?.passes ?? [])} device={props.device} />
}

function PassList(props: { passes: RenderPass[]; device: Device }) {
  return <For each={props.passes}>{(pass) => <PassEntry pass={pass} device={props.device} />}</For>
}

function PassEntry(props: { pass: RenderPass; device: Device }) {
  if (props.pass instanceof GroupPass) {
    return <GroupEntry pass={props.pass} device={props.device} />
  }
  // input passes only set render inputs: no GPU work to time
  const device = props.pass instanceof FunctionPass ? null : props.device
  return <LeafEntry pass={props.pass} device={device} />
}

function GroupEntry(props: { pass: GroupPass; device: Device }) {
  return (
    <Group title={props.pass.name} collapsible defaultCollapsed>
      <PassFlags pass={props.pass} device={null} />
      <PassList passes={props.pass.passes} device={props.device} />
    </Group>
  )
}

function LeafEntry(props: { pass: RenderPass; device: Device | null }) {
  return (
    <Group title={props.pass.name} collapsible defaultCollapsed>
      <PassFlags pass={props.pass} device={props.device} />
      <PassFields pass={props.pass} />
    </Group>
  )
}

/**
 * Description, on/off toggle of optional passes, GPU timer
 */
function PassFlags(props: { pass: RenderPass; device: Device | null }) {
  const panel = usePanel()
  const info = () => getPassInfo(props.pass)
  return (
    <>
      <Show when={info()?.note}>{(note) => <p class="nw-note nw-pass-note">{note()}</p>}</Show>
      <Show when={info()?.toggle}>{(toggle) => <BoolWidget {...panel.bind(toggle(), 'enabled')} />}</Show>
      <Show when={props.device}>{(device) => <PassTimer pass={props.pass} device={device()} />}</Show>
    </>
  )
}
