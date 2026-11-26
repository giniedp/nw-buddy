import { For, Match, Switch } from 'solid-js'
import { TextInput } from 'tweak-ui'
import { EngineSurface } from '../../../app/surface/EngineSurface'
import type { AssetViewProps } from '../registry'
import { createParticleModeStore, describeEffect } from './ParticleMode.store'
import './ParticleMode.css'

/**
 * A particle library (`libs/particles/*.xml`): its top level effects, the selected one shown by the engine at the
 * origin. One shot effects restart every few seconds. The library is parsed in the frontend (formats/particles), the
 * engine loads the effect through its particle system. The engine shows one content at a time (D5).
 */
export default function ParticleMode(props: AssetViewProps) {
  const store = createParticleModeStore(props)
  const { state } = store

  return (
    <Switch
      fallback={
        <div class="nw-empty">
          <p class="nw-note">Reading…</p>
        </div>
      }
    >
      <Match when={state.loadError}>
        <div class="nw-empty">
          <p class="nw-note">The particle library could not be read: {state.loadError}</p>
        </div>
      </Match>
      <Match when={state.ready}>
        <div class="nw-particles">
          <div class="nw-particles-list">
            <div class="nw-view-bar">
              <TextInput
                class="nw-view-filter"
                placeholder="Filter effects"
                value={state.filter}
                onInput={store.setFilter}
              />
            </div>
            <div class="nw-particles-effects">
              <For each={store.effects()}>
                {(effect) => (
                  <button
                    class="nw-particles-effect"
                    classList={{ 'nw-particles-effect-active': store.isSelected(effect) }}
                    title={effect.fullName}
                    onClick={() => store.select(effect.fullName)}
                  >
                    {effect.name}
                    <span class="nw-muted"> {describeEffect(effect)}</span>
                  </button>
                )}
              </For>
            </div>
            <div class="nw-view-info nw-particles-count">{state.count}</div>
          </div>
          <div class="nw-model">
            <div class="nw-view-bar">
              <span class="nw-view-info">{state.info}</span>
            </div>
            <EngineSurface
              class="nw-model-surface"
              active={props.shown}
              onRunning={store.attach}
              onDetach={store.detach}
            />
          </div>
        </div>
      </Match>
    </Switch>
  )
}
