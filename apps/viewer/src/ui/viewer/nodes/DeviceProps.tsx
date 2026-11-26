import type { Capabilities, Device } from '@gglib/graphics'
import { For } from 'solid-js'
import { BoolWidget, Group, ScalarWidget, Widget } from 'tweak-ui'
import { usePanel } from '../PanelScope'

const limits = [
  'maxTextureCount',
  'maxTextureSize',
  'maxVertexAttributes',
  'maxVertexTextureCount',
  'maxRenderTargets',
  'maxRenderTargetSize',
] as const satisfies ReadonlyArray<keyof Capabilities>

const features = [
  'canRenderR32F',
  'canRenderRG32F',
  'canRenderRGBA32F',
  'canFilterR32F',
  'canFilterRG32F',
  'canFilterRGBA32F',
  'canRenderR16F',
  'canRenderRG16F',
  'canRenderRGBA16F',
  'canFilterR16F',
  'canFilterRG16F',
  'canFilterRGBA16F',
] as const satisfies ReadonlyArray<keyof Capabilities>

const compressions = [
  ['textureCompressionAstc', 'Astc'],
  ['textureCompressionEtc2', 'Etc2'],
  ['textureCompressionEtc1', 'Etc1'],
  ['textureCompressionPvrtc', 'Pvrtc'],
  ['textureCompressionBc', 'Bc'],
  ['textureCompressionBptc', 'Bptc'],
] as const satisfies ReadonlyArray<readonly [keyof Capabilities, string]>

export function DeviceProps(props: { data: Device }) {
  const panel = usePanel()
  const capabilities = () => props.data.capabilities
  return (
    <>
      <ScalarWidget label="ndcMinZ" value={props.data.ndcMinZ} readonly decimals={0} />
      <Widget label="Backend">{props.data.isWebGPU ? 'WebGPU' : 'WebGL'}</Widget>
      <Group title="Capabilities">
        <For each={limits}>{(key) => <ScalarWidget {...panel.bind(capabilities(), key)} readonly decimals={0} />}</For>
        <For each={features}>{(key) => <BoolWidget {...panel.bind(capabilities(), key)} readonly />}</For>
        <For each={compressions}>
          {([key, label]) => <BoolWidget {...panel.bind(capabilities(), key)} label={label} readonly />}
        </For>
      </Group>
    </>
  )
}
