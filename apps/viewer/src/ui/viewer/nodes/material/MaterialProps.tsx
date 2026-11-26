import type { InputSlot, Material, Texture } from '@gglib/graphics'
import { createMemo, For, Match, Switch } from 'solid-js'
import { ColorWidget, colorObject, Group, ScalarWidget, TextWidget, VectorWidget } from 'tweak-ui'
import { usePanel } from '../../PanelScope'
import { inputBlocks, inputWidget, scalarRange, VECTOR_KEYS } from './inputs'
import { TextureWidget } from './TextureWidget'

const COLOR_FORMATS: Record<string, ReturnType<typeof colorObject>> = {
  vec3: colorObject('xyz'),
  vec4: colorObject('xyzw'),
}

/**
 * The inputs of a material that are not set by the engine, by block
 */
export function MaterialProps(props: { data: Material }) {
  const panel = usePanel()
  // only a new schema regroups the inputs, a redraw keeps the controls
  const schema = createMemo(() => panel.pull(() => props.data['schema'] as Record<string, InputSlot>))
  const blocks = createMemo(() => inputBlocks(schema()))
  return (
    <>
      <TextWidget {...panel.bind(props.data, 'name')} readonly />
      <TextWidget {...panel.bind(props.data, 'uid')} readonly />
      <For each={blocks()}>
        {(block) => (
          <Group title={block.name}>
            <For each={block.inputs}>{(slot) => <MaterialInput material={props.data} slot={slot} />}</For>
          </Group>
        )}
      </For>
    </>
  )
}

function MaterialInput(props: { material: Material; slot: InputSlot }) {
  const panel = usePanel()
  const name = () => props.slot.input
  const widget = () => inputWidget(props.slot)
  const value = <T,>() => panel.pull(() => props.material.getInput(props.slot) as T)
  const set = (value: unknown) => {
    props.material.setInput(props.slot, value as any)
    panel.redraw()
  }
  // vectors are modified in place
  const setElement = (element: number, key: string | number) => {
    const vector = props.material.getInput(props.slot) as unknown as Record<string | number, number>
    vector[key] = element
    set(vector)
  }
  return (
    <Switch>
      <Match when={widget() === 'scalar'}>
        <ScalarWidget label={name()} value={value<number>()} onInput={set} {...scalarRange(name())} decimals={3} />
      </Match>
      <Match when={widget() === 'color'}>
        <ColorWidget
          label={name()}
          format={COLOR_FORMATS[props.slot.type]}
          value={value<Record<string, number>>()}
          onInput={set}
        />
      </Match>
      <Match when={widget() === 'vector'}>
        <VectorWidget label={name()} keys={VECTOR_KEYS[props.slot.type]} value={value<object>()} onInput={setElement} />
      </Match>
      {/* no texture: assume the texture block is not enabled */}
      <Match when={widget() === 'texture' && value<Texture>()}>
        {(texture) => <TextureWidget label={name()} texture={texture()} />}
      </Match>
    </Switch>
  )
}
