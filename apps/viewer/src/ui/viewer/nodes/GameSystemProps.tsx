import type { GameSystem } from '@gglib/ecs'
import { BoolWidget } from 'tweak-ui'

/**
 * Whether the system takes part in the update and the render of the world
 */
export function GameSystemProps(props: { data: GameSystem }) {
  return (
    <>
      <BoolWidget label="Updatable" value={!!props.data.update} readonly align="start" />
      <BoolWidget label="Renderable" value={!!props.data.render} readonly align="start" />
    </>
  )
}
