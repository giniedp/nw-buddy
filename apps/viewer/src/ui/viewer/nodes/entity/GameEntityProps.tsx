import type { GameEntity } from '@gglib/ecs'
import { BoolWidget, ScalarWidget, TextWidget } from 'tweak-ui'
import { NodeProps } from '../NodeProps'
import { createGameEntityPropsStore } from './GameEntityProps.store'
import { SourceFiles } from './SourceFiles'

export function GameEntityProps(props: { data: GameEntity }) {
  const store = createGameEntityPropsStore(props)
  return (
    <>
      <TextWidget label="name" value={store.state.name} readonly />
      <TextWidget label="stateName" value={store.state.stateName} readonly />
      <BoolWidget label="Active" value={store.state.active} onInput={store.setActive} />
      <ScalarWidget label="Components" value={store.state.componentCount} readonly decimals={0} />
      <SourceFiles files={store.files()} />
      <NodeProps data={store.transform()} />
      <NodeProps data={store.debugShapes()} />
    </>
  )
}
