import { Index } from 'solid-js'
import { BoolWidget, PollWidget, ScalarWidget, TextWidget } from 'tweak-ui'
import type { AudioSystem } from '../../../audio/AudioSystem'
import { usePanel } from '../PanelScope'

/**
 * The lines of the log that are shown, newest first
 */
const LOG_LINES = 12

const mb = (bytes: number) => `${(bytes / 1048576).toFixed(1)} MB`

/**
 * The audio system: its engine and output stats (polled, the engine changes them without telling), the overrides
 * of the ambience, and the audio config, which is applied to the system on each commit
 */
export function AudioSystemProps(props: { data: AudioSystem }) {
  const panel = usePanel()
  const stats = () => props.data.engineStats
  const output = () => props.data.outputStats
  const config = () => props.data.config
  const override = (label: string, field: 'territory' | 'tract' | 'tod') => (
    <TextWidget
      label={label}
      value={panel.pull(() => props.data.overrides[field] ?? '')}
      onChange={(value) => {
        props.data.setOverrides({ ...props.data.overrides, [field]: value || undefined })
        panel.redraw()
      }}
    />
  )
  return (
    <>
      {/* enabling resumes the audio context, this runs in the input handler (user gesture) */}
      <BoolWidget {...panel.bind(props.data, 'enabled')} label="Enabled" />
      <ScalarWidget {...panel.bind(props.data, 'masterDb')} label="Master dB" min={-40} max={12} step={0.5} range />
      <PollWidget label="Context" value={output()?.state ?? '-'} />
      <PollWidget
        label="Output"
        value={output() ? `peak ${output().peak.toFixed(3)} rms ${output().rms.toFixed(4)}` : '-'}
      />
      <PollWidget label="Tract" value={stats()?.tract ?? '-'} />
      <PollWidget label="Territory" value={stats()?.territory ?? '-'} />
      <PollWidget label="POI" value={stats()?.poi ?? '-'} />
      <PollWidget label="TOD" value={stats()?.tod ?? '-'} />
      <PollWidget label="Banks" value={stats() ? `${stats().banksLoaded} (${mb(stats().bankBytes)})` : '-'} />
      <PollWidget label="Media" value={stats() ? `${stats().mediaDecoded} (${mb(stats().pcmBytes)} pcm)` : '-'} />
      <PollWidget label="Voices" value={output() ? `${output().voices} (${output().sources} sources)` : '-'} />
      <PollWidget label="Emitters" value={stats() ? `${stats().emittersActive} / ${stats().emitters}` : '-'} />
      <PollWidget label="Pending" value={stats()?.pending ?? '-'} />
      {override('Territory override', 'territory')}
      {override('Tract override', 'tract')}
      {override('TOD override', 'tod')}
      <ListWidget label="Beds" system={props.data} get={() => config().beds} set={(list) => (config().beds = list)} />
      <ListWidget
        label="Music"
        system={props.data}
        get={() => config().music}
        set={(list) => (config().music = list)}
      />
      <ConfigNumberWidget
        label="Music dB"
        system={props.data}
        get={() => config().musicDb}
        set={(value) => (config().musicDb = value)}
        min={-40}
        max={12}
        step={1}
      />
      <ListWidget
        label="Trigger allow"
        system={props.data}
        get={() => config().triggers.allow}
        set={(list) => (config().triggers.allow = list)}
      />
      <ListWidget
        label="Trigger skip"
        system={props.data}
        get={() => config().triggers.skip}
        set={(list) => (config().triggers.skip = list)}
      />
      <ListWidget
        label="Bank skip"
        system={props.data}
        get={() => config().banks.skip}
        set={(list) => (config().banks.skip = list)}
      />
      <ConfigNumberWidget
        label="Bank max MB"
        system={props.data}
        get={() => config().banks.maxSizeMB}
        set={(value) => (config().banks.maxSizeMB = value)}
        min={0}
        max={64}
        step={1}
      />
      <ConfigNumberWidget
        label="Emitter voices"
        system={props.data}
        get={() => config().maxEmitterVoices}
        set={(value) => (config().maxEmitterVoices = value)}
        min={0}
        max={64}
        step={1}
      />
      <Index each={Array.from({ length: LOG_LINES })}>
        {(_, i) => (
          <PollWidget label={i === 0 ? 'Log' : ''} value={props.data.log[props.data.log.length - 1 - i] ?? ''} />
        )}
      </Index>
    </>
  )
}

/**
 * The entries of a comma separated list, trimmed, without empty ones
 */
export function parseList(text: string): string[] {
  return text
    .split(',')
    .map((it) => it.trim())
    .filter(Boolean)
}

/**
 * Edits a list of strings as comma separated text, applied to the audio system on commit
 */
function ListWidget(props: { label: string; system: AudioSystem; get: () => string[]; set: (list: string[]) => void }) {
  const panel = usePanel()
  return (
    <TextWidget
      label={props.label}
      value={panel.pull(() => props.get().join(', '))}
      onChange={(value) => {
        props.set(parseList(value))
        props.system.applyConfig()
        panel.redraw()
      }}
    />
  )
}

/**
 * Edits a number of the audio config, applied to the audio system on commit
 */
function ConfigNumberWidget(props: {
  label: string
  system: AudioSystem
  get: () => number
  set: (value: number) => void
  min: number
  max: number
  step: number
}) {
  const panel = usePanel()
  return (
    <ScalarWidget
      label={props.label}
      value={panel.pull(props.get)}
      onChange={(value) => {
        props.set(value)
        props.system.applyConfig()
        panel.redraw()
      }}
      min={props.min}
      max={props.max}
      step={props.step}
    />
  )
}
