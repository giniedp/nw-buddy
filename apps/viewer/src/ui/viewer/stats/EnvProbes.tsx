import { Show } from 'solid-js'
import { BoolWidget, PollWidget, ScalarWidget } from 'tweak-ui'
import type { ProbeCubeLoader } from '../../../content/ProbeCubeLoader'
import type { EnvProbeDebugSystem } from '../../../game/probes/EnvProbeDebugSystem'
import type { EnvProbeSystem } from '../../../game/probes/EnvProbeSystem'
import { PROBE_ATLAS_SLOTS, PROBE_SPECULAR_MIPS } from '../../../graphics/probes/ProbeCubeAtlas'
import { usePanel } from '../PanelScope'

export interface EnvProbesProps {
  system: EnvProbeSystem
  cubes: ProbeCubeLoader
  debug: EnvProbeDebugSystem
}

/**
 * The environment probes: the active ones, the atlas slots in use (polled, the engine changes them), and the mirror
 * sphere that shows a slot of the atlas
 */
export function EnvProbes(props: EnvProbesProps) {
  const panel = usePanel()
  return (
    <>
      <PollWidget label="Active" value={props.system.active?.length} />
      <PollWidget label="Atlas" value={`${props.cubes.cubes.size} / ${PROBE_ATLAS_SLOTS} slots`} />
      <BoolWidget {...panel.bind(props.debug, 'enabled')} label="Mirror sphere" />
      <Show when={panel.pull(() => props.debug.enabled)}>
        <ScalarWidget {...panel.bind(props.debug, 'slot')} label="Slot" min={0} max={PROBE_ATLAS_SLOTS - 1} step={1} />
        <ScalarWidget
          {...panel.bind(props.debug, 'lod')}
          label="Lod"
          min={0}
          max={PROBE_SPECULAR_MIPS - 1}
          step={0.25}
        />
        <BoolWidget {...panel.bind(props.debug, 'diffuse')} label="Diffuse" />
      </Show>
    </>
  )
}
