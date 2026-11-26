import { TonemapOperator } from '@gglib/effects'
import { BloomPass, FxaaPass, TonemapPass, type RenderPass } from '@gglib/render'
import type { AbstractType, Type } from '@gglib/utils'
import { Show, type Component } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { BoolWidget, ScalarWidget, SelectWidget } from 'tweak-ui'
import { Cmaa2DebugModes, Cmaa2Pass } from '../../../graphics/passes/cmaa2/Cmaa2Pass'
import { GBufferDebugModes, GBufferDebugPass } from '../../../graphics/passes/gbuffer/GBufferDebugPass'
import { LightingPass } from '../../../graphics/passes/lighting/LightingPass'
import { LightingDebugModes } from '../../../graphics/passes/lighting/LightingPass.wgsl'
import { SmaaDebugModes, SmaaPass } from '../../../graphics/passes/smaa/SmaaPass'
import { XeGtaoPass } from '../../../graphics/passes/ssao/XeGtaoPass'
import { SsrDebugModes } from '../../../graphics/passes/ssr/Ssr.wgsl'
import { SsrPass } from '../../../graphics/passes/ssr/SsrPass'
import { usePanel } from '../PanelScope'
import type { PassFieldsView } from './types'

/**
 * The settings of a pass, rendered by the fields of its kind (see {@link PASS_FIELDS}). Nothing for other passes.
 */
export function PassFields(props: { pass: RenderPass }) {
  const fields = () => passFieldsOf(PASS_FIELDS, props.pass)?.fields
  return <Show when={fields()}>{(it) => <Dynamic component={it()} pass={props.pass} />}</Show>
}

/**
 * The view of the pass, the first whose type the pass is an instance of
 */
export function passFieldsOf(views: readonly PassFieldsView[], pass: RenderPass): PassFieldsView | undefined {
  return views.find((it) => pass instanceof (it.type as Function))
}

/**
 * Fields of the class: infers the type of the pass from the class
 */
function passFields<T extends RenderPass>(
  type: Type<T> | AbstractType<T>,
  fields: Component<{ pass: T }>,
): PassFieldsView<T> {
  return { type, fields }
}

function XeGtaoFields(props: { pass: XeGtaoPass }) {
  const panel = usePanel()
  return (
    <>
      <SelectWidget {...panel.bind(props.pass, 'quality')} options={['low', 'medium', 'high', 'ultra']} />
      <ScalarWidget {...panel.bind(props.pass, 'denoisePasses')} min={1} max={5} step={1} range />
      <ScalarWidget {...panel.bind(props.pass, 'radius')} min={0.01} max={5} step={0.01} range />
      <ScalarWidget {...panel.bind(props.pass, 'radiusMultiplier')} min={0.3} max={3} step={0.001} range />
      <ScalarWidget {...panel.bind(props.pass, 'falloffRange')} min={0} max={1} step={0.001} range />
      <ScalarWidget {...panel.bind(props.pass, 'sampleDistributionPower')} min={1} max={3} step={0.01} range />
      <ScalarWidget {...panel.bind(props.pass, 'thinOccluderCompensation')} min={0} max={0.7} step={0.01} range />
      <ScalarWidget {...panel.bind(props.pass, 'finalValuePower')} min={0.5} max={5} step={0.01} range />
      <ScalarWidget {...panel.bind(props.pass, 'depthMipSamplingOffset')} min={0} max={30} step={0.1} range />
      <ScalarWidget {...panel.bind(props.pass, 'denoiseBlurBeta')} min={0} max={10} step={0.1} range />
      <ScalarWidget {...panel.bind(props.pass, 'maxDistance')} min={0} step={1} />
    </>
  )
}

function GBufferDebugFields(props: { pass: GBufferDebugPass }) {
  const panel = usePanel()
  return <SelectWidget {...panel.bind(props.pass, 'mode')} options={[...GBufferDebugModes]} />
}

function LightingFields(props: { pass: LightingPass }) {
  const panel = usePanel()
  return (
    <>
      <SelectWidget {...panel.bind(props.pass, 'debug')} options={[...LightingDebugModes]} />
      <ScalarWidget {...panel.bind(props.pass, 'aoStrength')} min={0} max={1} step={0.01} range />
    </>
  )
}

function SsrFields(props: { pass: SsrPass }) {
  const panel = usePanel()
  return (
    <>
      <SelectWidget {...panel.bind(props.pass, 'debug')} options={[...SsrDebugModes]} />
      <ScalarWidget {...panel.bind(props.pass, 'debugMip')} min={0} max={12} step={1} range />
    </>
  )
}

function SmaaFields(props: { pass: SmaaPass }) {
  const panel = usePanel()
  return (
    <>
      <SelectWidget {...panel.bind(props.pass, 'preset')} options={['low', 'medium', 'high', 'ultra']} />
      <SelectWidget {...panel.bind(props.pass, 'debug')} options={[...SmaaDebugModes]} />
      <ScalarWidget {...panel.bind(props.pass, 'threshold')} min={0.01} max={0.3} step={0.005} range />
      <ScalarWidget {...panel.bind(props.pass, 'maxSearchSteps')} min={1} max={64} step={1} range />
      <ScalarWidget {...panel.bind(props.pass, 'maxSearchStepsDiag')} min={0} max={20} step={1} range />
      <ScalarWidget {...panel.bind(props.pass, 'cornerRounding')} min={0} max={100} step={1} range />
      <BoolWidget {...panel.bind(props.pass, 'predication')} />
      <ScalarWidget {...panel.bind(props.pass, 'predicationThreshold')} min={0} max={0.1} step={0.001} range />
      <ScalarWidget {...panel.bind(props.pass, 'predicationScale')} min={1} max={5} step={0.1} range />
      <ScalarWidget {...panel.bind(props.pass, 'predicationStrength')} min={0} max={1} step={0.01} range />
    </>
  )
}

function Cmaa2Fields(props: { pass: Cmaa2Pass }) {
  const panel = usePanel()
  return (
    <>
      <SelectWidget {...panel.bind(props.pass, 'preset')} options={['low', 'medium', 'high', 'ultra']} />
      <SelectWidget {...panel.bind(props.pass, 'debug')} options={[...Cmaa2DebugModes]} />
      <ScalarWidget {...panel.bind(props.pass, 'threshold')} min={0.01} max={0.3} step={0.005} range />
      <ScalarWidget {...panel.bind(props.pass, 'localContrastAdaptation')} min={0} max={0.5} step={0.01} range />
      <ScalarWidget {...panel.bind(props.pass, 'simpleShapeBluriness')} min={0} max={0.5} step={0.01} range />
      <BoolWidget {...panel.bind(props.pass, 'extraSharpness')} />
    </>
  )
}

function FxaaFields(props: { pass: FxaaPass }) {
  const panel = usePanel()
  return (
    <>
      <ScalarWidget {...panel.bind(props.pass, 'thresholdMin')} min={0} max={0.1} step={0.001} range />
      <ScalarWidget {...panel.bind(props.pass, 'thresholdMax')} min={0.03} max={0.35} step={0.001} range />
      <ScalarWidget {...panel.bind(props.pass, 'quality')} label="subpix" min={0} max={1} step={0.01} range />
    </>
  )
}

function BloomFields(props: { pass: BloomPass }) {
  const panel = usePanel()
  return (
    <>
      <SelectWidget {...panel.bind(props.pass, 'mode')} options={['kawase', 'jimnez']} />
      <ScalarWidget {...panel.bind(props.pass, 'threshold')} min={0} max={10} step={0.01} range />
      <ScalarWidget {...panel.bind(props.pass, 'knee')} min={0} max={1} step={0.01} range />
      <ScalarWidget {...panel.bind(props.pass, 'intensity')} min={0} max={2} step={0.01} range />
      <ScalarWidget {...panel.bind(props.pass, 'steps')} min={1} max={16} step={1} range />
    </>
  )
}

function TonemapFields(props: { pass: TonemapPass }) {
  const panel = usePanel()
  return (
    <>
      <SelectWidget {...panel.bind(props.pass, 'operator')} options={TonemapOperator} />
      <ScalarWidget {...panel.bind(props.pass, 'exposure')} min={0} max={10} step={0.01} range />
      <ScalarWidget {...panel.bind(props.pass, 'whitePoint')} min={0} max={20} step={0.1} range />
      <BoolWidget {...panel.bind(props.pass, 'srgb')} />
    </>
  )
}

/**
 * The settings of the passes, by kind
 */
export const PASS_FIELDS: PassFieldsView[] = [
  passFields(XeGtaoPass, XeGtaoFields),
  passFields(GBufferDebugPass, GBufferDebugFields),
  passFields(LightingPass, LightingFields),
  passFields(SsrPass, SsrFields),
  passFields(SmaaPass, SmaaFields),
  passFields(Cmaa2Pass, Cmaa2Fields),
  passFields(FxaaPass, FxaaFields),
  passFields(BloomPass, BloomFields),
  passFields(TonemapPass, TonemapFields),
]
