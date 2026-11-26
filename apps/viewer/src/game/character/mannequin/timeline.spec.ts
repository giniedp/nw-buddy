import { describe, expect, it } from 'vitest'
import { adbFragmentVariants, parseAnimationDatabase } from '../../../formats/mannequin'
import { fragmentTimeline, timelineBarAt, timelineTime } from './timeline'

// shapes of animations/mannequin/adb/npc_alligator_anims.adb (shortened)
const ADB = `<AnimDB FragDef="actions.xml" TagDef="tags.xml">
 <FragmentList>
  <Idle>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.4"/>
     <Animation name="alligator_ambient_idle" flags="Loop"/>
    </AnimLayer>
   </Fragment>
  </Idle>
  <Attack_Bite>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0.1" Duration="0.2"/>
     <Animation name="alligator_bite" speed="2"/>
     <Blend ExitTime="-1" StartTime="0" Duration="0.3"/>
     <Animation name="alligator_combat_idle" flags="Loop"/>
    </AnimLayer>
    <AnimLayer>
     <Blend ExitTime="0.25" StartTime="0" Duration="0.1"/>
     <Animation name="alligator_jaw_add"/>
     <Blend ExitTime="0.5" StartTime="0" Duration="0.1"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="0.5" StartTime="0" Duration="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams><DamageTableRow value="Attack_Bite"/></ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.2" StartTime="0" Duration="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0"/>
     <Procedural type="Homing" contextType="HomingContext"/>
     <Blend ExitTime="1" StartTime="0" Duration="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
   </Fragment>
  </Attack_Bite>
 </FragmentList>
</AnimDB>`

const DURATIONS: Record<string, number> = {
  alligator_ambient_idle: 2,
  alligator_bite: 1.1,
  alligator_combat_idle: 1.5,
  alligator_jaw_add: 0.4,
}
const durationOf = (name: string) => DURATIONS[name] ?? null
const adb = parseAnimationDatabase(ADB)

describe('fragmentTimeline', () => {
  it('lays out a looping fragment over one cycle of its clip', () => {
    const timeline = fragmentTimeline(adbFragmentVariants(adb, 'Idle')[0], durationOf)
    expect(timeline.duration).toBeCloseTo(2)
    expect(timeline.loop).toEqual({ start: 0, length: 2 })
    expect(timeline.animLayers[0]).toHaveLength(1)
    expect(timeline.animLayers[0][0]).toMatchObject({ start: 0, name: 'alligator_ambient_idle', loop: true })
    expect(timeline.procLayers).toEqual([])
  })

  it('resolves exit times, reference lengths and the proc bars', () => {
    const timeline = fragmentTimeline(adbFragmentVariants(adb, 'Attack_Bite')[0], durationOf)
    const [bite, idle] = timeline.animLayers[0]
    expect(bite).toMatchObject({ start: 0, name: 'alligator_bite', speed: 2, startTime: 0.1, fade: 0.2 })
    // a negative exit time waits for the previous clip's reference length: (1.1 - 0.1) / 2
    expect(idle.start).toBeCloseTo(0.5)
    expect(bite.end).toBeCloseTo(0.5)
    expect(idle).toMatchObject({ name: 'alligator_combat_idle', loop: true })
    // the looping combat idle ends the fragment after one cycle
    expect(timeline.duration).toBeCloseTo(2)
    expect(timeline.loop?.start).toBeCloseTo(0.5)
    expect(timeline.loop?.length).toBeCloseTo(1.5)

    const [jaw, stop] = timeline.animLayers[1]
    expect(jaw).toMatchObject({ start: 0.25, name: 'alligator_jaw_add' })
    expect(stop.start).toBeCloseTo(0.75)
    expect(stop.name).toBeNull()

    const damage = timeline.procLayers[0]
    expect(damage).toHaveLength(3)
    expect(damage[0]).toEqual({ start: 0, end: 0.5, procedural: null })
    expect(damage[1].procedural?.type).toBe('CAGE-Damage')
    expect(damage[1].procedural?.params['DamageTableRow']).toBe('Attack_Bite')
    expect(damage[1].start).toBeCloseTo(0.5)
    expect(damage[1].end).toBeCloseTo(0.7)
    expect(damage[2].procedural).toBeNull()
    expect(damage[2].end).toBeCloseTo(timeline.duration)
  })

  it('extends the duration to the last bar start', () => {
    const timeline = fragmentTimeline(adbFragmentVariants(adb, 'Attack_Bite')[0], () => null)
    // no clip lengths: the homing layer's end marker at 1 s sets the duration
    expect(timeline.duration).toBeCloseTo(1)
    expect(timeline.loop).toBeNull()
  })

  it('finds the active bar and wraps the time of loops', () => {
    const timeline = fragmentTimeline(adbFragmentVariants(adb, 'Attack_Bite')[0], durationOf)
    const damage = timeline.procLayers[0]
    expect(timelineBarAt(damage, 0.2)).toBe(-1)
    expect(timelineBarAt(damage, 0.6)).toBe(1)
    expect(timelineBarAt(damage, 0.8)).toBe(-1)
    expect(timelineBarAt(timeline.procLayers[1], 0.5)).toBe(0)
    expect(timelineBarAt(timeline.procLayers[1], 1.2)).toBe(-1)
    expect(timelineTime(timeline, 1)).toBeCloseTo(1)
    // past the end: 0.5 + (2.5 - 0.5) % 1.5
    expect(timelineTime(timeline, 2.5)).toBeCloseTo(1)
    const oneShot = fragmentTimeline(adbFragmentVariants(adb, 'Attack_Bite')[0], () => null)
    expect(timelineTime(oneShot, 5)).toBeCloseTo(1)
  })
})
