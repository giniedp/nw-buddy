import { createEngineSurfaceStore, type EngineSurfaceProps } from './EngineSurface.store'
import './EngineSurface.css'

/**
 * A container that shows the engine canvas, its children are placed above the canvas.
 * The engine runs while a surface is attached and is suspended when the last one detaches
 * (see ui/app/engine.ts, the engine of the app).
 */
export function EngineSurface(props: EngineSurfaceProps) {
  const store = createEngineSurfaceStore(props)
  return (
    <div class={props.class ? `nw-engine-surface ${props.class}` : 'nw-engine-surface'} ref={store.setHost}>
      {props.children}
    </div>
  )
}
