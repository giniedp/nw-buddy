import { Renderer } from '@gglib/render'
import { ProbeCubeLoader } from '../../../content/ProbeCubeLoader'
import { DebugShapeSystem } from '../../../game/debug/DebugShapeSystem'
import { SkyLightSystem } from '../../../game/level/SkyLightSystem'
import { EnvProbeDebugSystem } from '../../../game/probes/EnvProbeDebugSystem'
import { EnvProbeSystem } from '../../../game/probes/EnvProbeSystem'
import type { NwViewer } from '../../../viewer'
import { usePanel } from '../PanelScope'
import type { EnvProbesProps } from './EnvProbes'
import { graphTabs } from './graphs'

export type StatsPanelStore = ReturnType<typeof createStatsPanelStore>

/**
 * The engine objects of the stats panel. The panel edits them through the `PanelScope`, the store hands them out.
 */
export function createStatsPanelStore(props: { viewer: NwViewer }) {
  const panel = usePanel()
  const viewer = () => props.viewer
  const system = <T>(type: new (...args: any[]) => T) => viewer().world.getSystem(type)

  return {
    /**
     * The graph rows sample the engine on their own
     */
    graphs: graphTabs(props.viewer),
    /**
     * The debug output of the viewer, for a `SelectWidget`
     */
    debugOutput: panel.bind(props.viewer, 'debug'),
    camera: () => viewer().camera,
    debugShapes: () => system(DebugShapeSystem),
    timeOfDay: () => system(SkyLightSystem)?.timeOfDay,
    /**
     * Undefined without the probe systems
     */
    envProbes: (): EnvProbesProps | undefined => {
      const result = {
        system: system(EnvProbeSystem),
        cubes: system(ProbeCubeLoader),
        debug: system(EnvProbeDebugSystem),
      }
      return result.system && result.cubes && result.debug ? result : undefined
    },
    pipeline: () => system(Renderer)?.pipeline,
    device: () => viewer().device,
  }
}
