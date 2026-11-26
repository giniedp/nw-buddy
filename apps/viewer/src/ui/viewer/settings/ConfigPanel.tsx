import { For, Match, Show, Switch } from 'solid-js'
import { BoolWidget, Button, Flex, Group, ScalarWidget, SelectWidget, TextWidget, Widget } from 'tweak-ui'
import type { ChoiceProperty, Config, ConfigProperty, ConfigSchema, NumberProperty } from '../../../config'
import { createConfigPanelStore, createPropertyRowStore } from './ConfigPanel.store'
import { parseNumberList, stepDecimals } from './config'

/**
 * Generic panel for a {@link Config}: one row per property, grouped by {@link ConfigProperty.group}, labeled by
 * {@link ConfigProperty.label}. Hidden properties and properties that don't apply with the current values
 * ({@link ConfigProperty.available}) are left out. Every change is saved. The reset button is separate, see
 * {@link ConfigActions}.
 */
export function ConfigPanel(props: { config: Config<ConfigSchema> }) {
  const store = createConfigPanelStore(props)
  return (
    <Show when={store.state.groups.length} fallback={<p class="nw-note">No settings yet</p>}>
      <For each={store.state.groups}>
        {(group) => (
          <Group title={group.title} collapsible>
            <For each={group.names}>
              {(name) => (
                <Show when={store.available(name)}>
                  <PropertyRow config={props.config} name={name} />
                </Show>
              )}
            </For>
          </Group>
        )}
      </For>
    </Show>
  )
}

/**
 * The reset button of a {@link Config}, e.g. for a dialog footer: all properties back to their defaults, saved. The
 * rows update on their own.
 */
export function ConfigActions(props: { config: Config<ConfigSchema>; large?: boolean }) {
  return (
    <Button
      large={props.large}
      onClick={() => {
        props.config.reset()
        props.config.save()
      }}
    >
      Reset all
    </Button>
  )
}

function PropertyRow(props: { config: Config<ConfigSchema>; name: string }) {
  const store = createPropertyRowStore(props)
  return (
    <div title={store.state.property.description}>
      <PropertyWidget
        value={store.state.value}
        onChange={store.set}
        property={store.state.property}
        label={store.state.property.label ?? props.name}
      />
    </div>
  )
}

/**
 * The widget of a property by its kind
 */
function PropertyWidget(props: {
  value: unknown
  onChange: (value: unknown) => void
  property: ConfigProperty
  label: string
}) {
  const value = <T,>() => props.value as T
  const readonly = () => !props.property.editable
  return (
    <Switch>
      <Match when={props.property.kind === 'boolean' && props.property.display === 'buttons'}>
        <ChoiceButtons
          label={props.label}
          value={value<boolean>()}
          onChange={props.onChange}
          options={BOOLEAN_BUTTONS}
          readonly={readonly()}
        />
      </Match>
      <Match when={props.property.kind === 'boolean'}>
        <BoolWidget label={props.label} value={value<boolean>()} onInput={props.onChange} readonly={readonly()} />
      </Match>
      <Match when={props.property.kind === 'number' || props.property.kind === 'integer'}>
        <NumberWidget
          label={props.label}
          property={props.property as NumberProperty}
          value={value<number>()}
          onChange={props.onChange}
          readonly={readonly()}
        />
      </Match>
      <Match when={props.property.kind === 'choice' && props.property.display === 'buttons'}>
        <ChoiceButtons
          label={props.label}
          value={value<string>()}
          onChange={props.onChange}
          options={(props.property as ChoiceProperty).options.map((it) => ({ label: it, value: it }))}
          readonly={readonly()}
        />
      </Match>
      <Match when={props.property.kind === 'choice'}>
        <SelectWidget
          label={props.label}
          value={value<unknown>()}
          onInput={props.onChange}
          options={[...(props.property as ChoiceProperty).options]}
          readonly={readonly()}
        />
      </Match>
      <Match when={props.property.kind === 'vec3' || props.property.kind === 'numberList'}>
        {/* edited as comma separated numbers */}
        <TextWidget
          label={props.label}
          value={value<number[]>().join(', ')}
          onChange={(text) => props.onChange(parseNumberList(text))}
          readonly={readonly()}
        />
      </Match>
    </Switch>
  )
}

/**
 * The buttons of a boolean shown as buttons
 */
const BOOLEAN_BUTTONS = [
  { label: 'off', value: false },
  { label: 'on', value: true },
]

/**
 * A choice as one button per option, the selected one pressed
 */
function ChoiceButtons<V>(props: {
  label: string
  value: V
  onChange: (value: V) => void
  options: ReadonlyArray<{ label: string; value: V }>
  readonly: boolean
}) {
  return (
    <Widget label={props.label}>
      <Flex row>
        <For each={props.options}>
          {(option) => (
            <Button
              active={props.value === option.value}
              disabled={props.readonly}
              onClick={() => props.onChange(option.value)}
            >
              {option.label}
            </Button>
          )}
        </For>
      </Flex>
    </Widget>
  )
}

function NumberWidget(props: {
  label: string
  property: NumberProperty
  value: number
  onChange: (value: number) => void
  readonly: boolean
}) {
  const isInteger = () => props.property.kind === 'integer'
  return (
    <ScalarWidget
      label={props.label}
      value={props.value}
      // the value is controlled: dragging reports through onInput, without it the drag would not move
      onInput={props.onChange}
      onChange={props.onChange}
      min={props.property.min}
      max={props.property.max}
      step={props.property.step ?? (isInteger() ? 1 : undefined)}
      range={props.property.min != null && props.property.max != null}
      decimals={isInteger() ? 0 : stepDecimals(props.property.step)}
      readonly={props.readonly}
    />
  )
}
