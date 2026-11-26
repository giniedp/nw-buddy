import type { CameraComponent } from '@gglib/components'
import { DEGREE_TO_RAD } from '@gglib/math'
import { Show } from 'solid-js'
import { AngleWidget, BitmaskWidget, BoolWidget, ScalarWidget, SelectWidget } from 'tweak-ui'
import { MaterialLayerMasks } from '../../../material'
import { usePanel } from '../PanelScope'

const cameraTypes = [
  { value: 'perspective', label: 'Perspective' },
  { value: 'orthographic', label: 'Orthographic' },
] as const

export function CameraComponentProps(props: { data: CameraComponent }) {
  const panel = usePanel()
  const type = () => panel.pull(() => props.data.type)
  return (
    <>
      <ScalarWidget {...panel.bind(props.data, 'near')} min={0.01} max={1} step={0.01} range />
      <ScalarWidget {...panel.bind(props.data, 'far')} min={2} max={4000} step={1} range />
      <BoolWidget {...panel.bind(props.data, 'reversedZ')} />
      <SelectWidget {...panel.bind(props.data, 'type')} options={cameraTypes} />
      <Show when={type() === 'perspective'}>
        <AngleWidget
          {...panel.bind(props.data, 'perspectiveFov')}
          label="FOV"
          min={1 * DEGREE_TO_RAD}
          max={180 * DEGREE_TO_RAD}
          step={1 * DEGREE_TO_RAD}
          degree={false}
        />
      </Show>
      <Show when={type() === 'orthographic'}>
        <ScalarWidget
          {...panel.bind(props.data, 'orthographicScale')}
          label="Scale"
          min={1}
          max={window.innerWidth}
          step={1}
          range
        />
      </Show>
      <BitmaskWidget
        {...panel.bind(props.data, 'visibilityMask')}
        label="Layers"
        bitCount={Object.keys(MaterialLayerMasks).length}
        bits={MaterialLayerMasks}
      />
    </>
  )
}
