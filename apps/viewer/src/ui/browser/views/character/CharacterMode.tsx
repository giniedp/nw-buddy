import { For, Index, Show } from 'solid-js'
import { BoolInput, Button, ButtonGroup, Group, Icon, ScalarInput, Split } from 'tweak-ui'
import { EngineSurface } from '../../../app/surface/EngineSurface'
import { browserHref } from '../../../app/urls'
import { ExportButton } from '../../../common/export/ExportButton'
import { Link } from '../../../common/Link'
import { TrackBar } from '../../../common/track-bar/TrackBar'
import svgFollow from '../../../icons/camera-viewfinder.svg?raw'
import svgPause from '../../../icons/pause.svg?raw'
import svgPlay from '../../../icons/play.svg?raw'
import type { AssetViewProps } from '../registry'
import CharacterAdbFragments from './CharacterAdbFragments'
import CharacterAnimations from './CharacterAnimations'
import { createCharacterModeStore } from './CharacterMode.store'
import { clipCount, fileName } from './format'
import './CharacterMode.css'

/**
 * A `.cdf` shown by the engine and animated: its skins and cloth with their materials, skinned by the skeleton.
 * - Animations: the clips and blend spaces of its set by folder; a click plays one (cross faded)
 * - ADB Fragments: the game's named animations of a Mannequin database with their variants; a click plays a variant
 * - Export: the checked animations go into the GLB of the tab's Export, the playing one when none is checked
 *
 * A blend space gets a slider per motion parameter. The engine shows one content at a time.
 */
export default function CharacterMode(props: AssetViewProps) {
  const store = createCharacterModeStore(props)
  const { state } = store

  return (
    <Split
      row
      class="nw-character"
      fluid={1}
      minSize={200}
      defaultSizes={[state.settings.listWidth ? `${state.settings.listWidth}px` : 'clamp(16rem, 25%, 24rem)']}
      onResize={(sizes) => store.update({ listWidth: Math.round(sizes[0]) })}
    >
      <div class="nw-character-list">
        <div class="nw-view-bar">
          <ButtonGroup>
            <Button
              ghost
              active={state.settings.list === 'animations'}
              title="The clips and blend spaces of the character's animation set"
              onClick={() => store.update({ list: 'animations' })}
            >
              Animations
            </Button>
            <Button
              ghost
              active={state.settings.list === 'fragments'}
              title="The fragments of a Mannequin animation database (ADB): the game's named animations with their variants"
              onClick={() => store.update({ list: 'fragments' })}
            >
              ADB Fragments
            </Button>
          </ButtonGroup>
        </div>
        <Show when={state.settings.list === 'animations'}>
          <CharacterAnimations mode={store} />
        </Show>
        <Show when={state.settings.list === 'fragments'}>
          <CharacterAdbFragments ctx={props.ctx} mode={store} />
        </Show>

        <Group title="Export" class="nw-character-section">
          <div class="nw-view-bar">
            <Show
              when={state.selected.length}
              fallback={
                <span
                  class="nw-muted"
                  title="The GLB includes the playing animation. Check animations to choose others."
                >
                  With playing animation
                </span>
              }
            >
              <span title="The GLB includes the checked animations">With {clipCount(state.selected.length)}</span>
            </Show>
            <span class="nw-push-end">
              <ExportButton path={props.ctx.path} />
            </span>
          </div>
        </Group>
        <Group title="Character Parts" class="nw-character-section">
          <div class="nw-character-parts">
            <For each={state.parts}>
              {(part, index) => (
                <div class="nw-character-part-row">
                  <span
                    class="nw-character-part-toggle"
                    title={
                      part.hidden ? 'Draw this part. The game hides it until game code shows it.' : 'Draw this part'
                    }
                  >
                    <BoolInput value={part.visible} onInput={(value) => store.setPartVisible(index(), value)} />
                  </span>
                  <Link
                    class="nw-character-part"
                    classList={{ 'nw-character-part-hidden': part.hidden }}
                    href={browserHref(part.mesh)}
                    title={`Open ${part.mesh}\n${part.material || 'material of the mesh'}${part.hidden ? '\nHidden in the game until game code shows it' : ''}`}
                  >
                    <span
                      classList={{
                        'nw-error': part.state === 'failed',
                        'nw-muted': part.state === 'loading' || part.hidden,
                      }}
                    >
                      {part.name || '(unnamed)'}
                    </span>
                    <span class="nw-character-part-file">{fileName(part.mesh)}</span>
                  </Link>
                </div>
              )}
            </For>
          </div>
        </Group>
      </div>
      <div class="nw-model">
        <div class="nw-view-bar">
          <Button
            square
            title={state.play?.paused ? 'Play' : 'Pause'}
            icon={<Icon svg={state.play?.paused ? svgPlay : svgPause} />}
            onClick={store.togglePause}
          />
          <ScalarInput
            class="nw-character-slider"
            value={state.play?.seconds ?? 0}
            min={0}
            max={state.play?.duration || 1}
            step={0.001}
            decimals={3}
            range
            slotBefore={<span class="nw-view-label">{state.play?.name ?? 'bind pose'}</span>}
            unit={`/ ${(state.play?.duration ?? 0).toFixed(3)} s`}
            onInput={store.scrub}
          />
        </div>
        <Show when={store.trackTimeline()}>
          {(timeline) => (
            <div class="nw-view-bar">
              <TrackBar class="nw-character-track" timeline={timeline()} time={store.trackTime()} />
            </div>
          )}
        </Show>
        <div class="nw-view-bar">
          <ScalarInput
            class="nw-character-number"
            value={state.settings.speed}
            min={-2}
            max={4}
            step={0.05}
            decimals={2}
            slotBefore={<span class="nw-view-label">speed</span>}
            onInput={store.setSpeed}
          />
          <label class="nw-view-option" title="Restart the animation at its end, else it holds its last pose">
            <BoolInput value={state.settings.loop} onInput={store.setLoop} />
            <span>loop</span>
          </label>
          <label class="nw-view-option" title="Draw the joints and bones">
            <BoolInput value={state.settings.skeleton} onInput={store.setSkeleton} />
            <span>skeleton</span>
          </label>
          <Show when={state.hasHitboxes}>
            <label class="nw-view-option" title="Draw the melee hit shapes of the damage bars that run">
              <BoolInput value={state.settings.hitboxes} onInput={store.setHitboxes} />
              <span>hitboxes</span>
            </label>
          </Show>
          <label
            class="nw-view-option"
            title="Keep the root where the animation starts, as the game does for its characters. Off, the root travels with the animation."
          >
            <BoolInput value={state.settings.inPlace} onInput={store.setInPlace} />
            <span>in place</span>
          </label>
          <Button
            ghost
            class="nw-push-end"
            active={state.following}
            title="Keep the camera on the character's body, also when an animation moves it away. Moving the camera ends it."
            icon={<Icon svg={svgFollow} />}
            onClick={store.toggleFollow}
          >
            Follow
          </Button>
          <Button ghost title="Point the camera at the character again" onClick={store.resetCamera}>
            Reset camera
          </Button>
        </div>
        <Show when={state.play?.blend}>
          {(blend) => (
            <div class="nw-view-bar nw-character-blend">
              <Index each={blend()}>
                {(dimension) => (
                  <ScalarInput
                    class="nw-character-slider"
                    value={dimension().value}
                    min={dimension().min}
                    max={dimension().max}
                    step={(dimension().max - dimension().min) / 100 || 0.01}
                    decimals={2}
                    range
                    slotBefore={<span class="nw-view-label">{dimension().name}</span>}
                    onInput={(value) => store.setMotionParameter(dimension().param, value)}
                  />
                )}
              </Index>
              <span class="nw-view-info nw-character-weights" title={state.play?.blendWeights}>
                {state.play?.blendWeights}
              </span>
            </div>
          )}
        </Show>
        <EngineSurface class="nw-model-surface" active={props.shown} onRunning={store.attach} onDetach={store.detach} />
      </div>
    </Split>
  )
}
