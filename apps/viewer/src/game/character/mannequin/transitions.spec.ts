import { describe, expect, it } from 'vitest'
import { adbFragmentVariants, parseAnimationDatabase } from '../../../formats/mannequin'
import { assembleFragment, findTransitions, type TransitionQuery } from './transitions'

// shapes of animations/mannequin/adb/player/player.adb (shortened)
const ADB = `<AnimDB FragDef="actions.xml" TagDef="tags.xml">
 <FragmentList>
  <Idle>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer><Blend ExitTime="0" StartTime="0" Duration="0.5"/><Animation name="idle" flags="Loop"/></AnimLayer>
   </Fragment>
  </Idle>
  <Strafe>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer><Animation name="run" flags="Loop"/></AnimLayer>
   </Fragment>
  </Strafe>
 </FragmentList>
 <FragmentBlendList>
  <Blend from="Idle" to="Idle">
   <Variant from="Exhausted" to="">
    <Fragment BlendOutDuration="0.2" selectTime="0" enterTime="0">
     <AnimLayer><Blend ExitTime="0" StartTime="0" Duration="0.6" terminal="1"/></AnimLayer>
    </Fragment>
   </Variant>
  </Blend>
  <Blend from="Strafe" to="Idle">
   <Variant from="" to="Stand">
    <Fragment BlendOutDuration="0.2" selectTime="0" enterTime="0">
     <AnimLayer>
      <Blend ExitTime="0" StartTime="0" Duration="0.15"/>
      <Animation name="run_stop"/>
      <Blend ExitTime="0.73" StartTime="0.16" Duration="0.33" terminal="1"/>
     </AnimLayer>
    </Fragment>
    <Fragment BlendOutDuration="0.2" selectTime="1" enterTime="0">
     <AnimLayer>
      <Blend ExitTime="0" StartTime="0" Duration="0.15"/>
      <Animation name="run_stop_late"/>
      <Blend ExitTime="0.5" StartTime="0" Duration="0.2" terminal="1"/>
     </AnimLayer>
    </Fragment>
   </Variant>
   <Variant from="" to="Stand+Exhausted">
    <Fragment BlendOutDuration="0.2" selectTime="0" enterTime="0">
     <AnimLayer>
      <Animation name="run_stop_to_exhaust"/>
      <Blend ExitTime="-1" StartTime="0" Duration="0.3" terminal="1"/>
     </AnimLayer>
    </Fragment>
   </Variant>
  </Blend>
  <Blend from="Strafe" to="">
   <Variant from="Offhand" to="Offhand">
    <Fragment BlendOutDuration="0.2" selectTime="0" enterTime="0">
     <AnimLayer><Blend ExitTime="0" StartTime="0" Duration="0.4" terminal="1"/></AnimLayer>
    </Fragment>
   </Variant>
  </Blend>
  <Blend from="" to="Idle">
   <Variant from="Offhand" to="Offhand">
    <Fragment BlendOutDuration="0.2" selectTime="0" enterTime="0">
     <AnimLayer><Blend ExitTime="0" StartTime="0" Duration="0.7" terminal="1"/></AnimLayer>
    </Fragment>
   </Variant>
  </Blend>
 </FragmentList>
</AnimDB>`.replace('</FragmentList>\n</AnimDB>', '</FragmentBlendList>\n</AnimDB>')

const adb = parseAnimationDatabase(ADB)
const idle = adbFragmentVariants(adb, 'Idle')[0]
const durations: Record<string, number> = { run_stop: 1, run_stop_late: 1, run_stop_to_exhaust: 0.8, idle: 2, run: 1 }
const duration = (name: string) => durations[name] ?? null

function query(patch: Partial<TransitionQuery>): TransitionQuery {
  return { from: 'Strafe', to: 'Idle', tagsFrom: [], tagsTo: ['Stand'], required: [], fragmentTime: 0, ...patch }
}

describe('findTransitions', () => {
  it('takes the most specific variant whose tags are set', () => {
    const [plain] = findTransitions(adb.blends, query({}))
    expect(plain.fragment.animLayers[0].sequence[0].animation?.name).toBe('run_stop')
    const [exhausted] = findTransitions(adb.blends, query({ tagsTo: ['stand', 'exhausted'] }))
    expect(exhausted.fragment.animLayers[0].sequence[0].animation?.name).toBe('run_stop_to_exhaust')
  })

  it('selects the blend whose select time the fragment time reached', () => {
    const [late] = findTransitions(adb.blends, query({ fragmentTime: 1.2 }))
    expect(late.selectTime).toBe(1)
    expect(late.fragment.animLayers[0].sequence[0].animation?.name).toBe('run_stop_late')
  })

  it('falls back to exit, then entry pairs and requires the scope tags', () => {
    // no exact Strafe → Idle variant for the Offhand scope: the exit, followed by the entry into Idle
    const offhand = findTransitions(
      adb.blends,
      query({ tagsFrom: ['Offhand'], tagsTo: ['Offhand'], required: ['Offhand'] }),
    )
    expect(offhand.map((it) => `${it.from}>${it.to}`)).toEqual(['strafe>', '>idle'])
    expect(findTransitions(adb.blends, query({ from: 'Idle', tagsTo: [] }))).toEqual([])
    expect(findTransitions(adb.blends, query({ from: 'Idle', tagsFrom: ['Exhausted'] }))[0].to).toBe('idle')
  })
})

describe('assembleFragment', () => {
  it('lets a terminal transition blend set the blend of the fragment clip', () => {
    const transitions = findTransitions(adb.blends, query({ from: 'Idle', tagsFrom: ['Exhausted'] }))
    const result = assembleFragment(transitions, idle, duration)
    expect(result.layers[0].map((it) => [it.animation?.name, it.blend.exitTime, it.blend.duration])).toEqual([
      ['idle', 0, 0.6],
    ])
    expect(result.oneShot).toBe(false)
  })

  it('plays the transition clip, then the fragment at the terminal blend', () => {
    const transitions = findTransitions(adb.blends, query({}))
    const result = assembleFragment(transitions, idle, duration)
    expect(
      result.layers[0].map((it) => [it.animation?.name, it.blend.exitTime, it.blend.duration, it.blend.startTime]),
    ).toEqual([
      ['run_stop', 0, 0.15, 0],
      ['idle', 0.73, 0.33, 0.16],
    ])
    expect(result.transitionDuration).toBeCloseTo(0.73)
    expect(result.fragmentDuration).toBeCloseTo(0)
  })

  it('resolves a negative exit time of a transition to the reference length of its clip', () => {
    const transitions = findTransitions(adb.blends, query({ tagsTo: ['Stand', 'Exhausted'] }))
    const result = assembleFragment(transitions, idle, duration)
    expect(result.layers[0].map((it) => [it.animation?.name, it.blend.exitTime])).toEqual([
      ['run_stop_to_exhaust', 0],
      ['idle', 0.8],
    ])
  })

  it('plays the fragment alone without transitions', () => {
    const result = assembleFragment([], idle, duration)
    expect(result.layers[0].map((it) => [it.animation?.name, it.blend.exitTime, it.blend.duration])).toEqual([
      ['idle', 0, 0.5],
    ])
  })
})
