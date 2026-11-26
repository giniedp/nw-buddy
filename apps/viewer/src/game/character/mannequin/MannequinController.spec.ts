import { AnimationMixer, AnimationPose, AnimationRig, type AnimationSource } from '@gglib/model'
import { describe, expect, it } from 'vitest'
import {
  adbFragmentVariants,
  parseAnimationDatabase,
  parseControllerDefinition,
  parseTagDefinition,
  type FragmentCandidate,
} from '../../../formats/mannequin'
import { MannequinController } from './MannequinController'
import { fragmentScopes, MannequinTags, TagState, type MannequinSetup } from './setup'

const CONTROLLER = `<ControllerDef>
 <Tags filename="tags.xml"/>
 <Fragments filename="actions.xml"/>
 <FragmentDefs>
  <Idle scopes="FullBody+Offhand"/>
  <Emote_Sit scopes="FullBody"/>
  <Look scopes="FullBody+Offhand"/>
  <Wave scopes="UpperBody">
   <Override tags="Sitting" scopes="FullBody+UpperBody"/>
  </Wave>
  <Swing scopes="FullBody+Weapon"/>
 </FragmentDefs>
 <ScopeContextDefs><Char3P/><WeaponContext/></ScopeContextDefs>
 <ScopeDefs>
  <FullBody layer="0" numLayers="2" context="Char3P"/>
  <UpperBody layer="4" numLayers="1" context="Char3P"/>
  <Offhand layer="8" numLayers="1" context="Char3P" Tags="Offhand"/>
  <Weapon layer="0" numLayers="2" context="WeaponContext"/>
 </ScopeDefs>
</ControllerDef>`

const TAGS = `<TagDefinition version="2">
 <Tags>
  <Tag name="Offhand"/>
  <Tag name="Sitting"/>
  <Group name="Weapon"><Tag name="Sword"/><Tag name="Axe"/></Group>
 </Tags>
</TagDefinition>`

const ADB = `<AnimDB FragDef="actions.xml" TagDef="tags.xml">
 <FragmentList>
  <Idle>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer><Blend ExitTime="0" StartTime="0" Duration="0.3"/><Animation name="idle" flags="Loop"/></AnimLayer>
   </Fragment>
   <Fragment BlendOutDuration="0.2" Tags="Offhand">
    <AnimLayer><Animation name="offhand_idle" flags="Loop"/></AnimLayer>
   </Fragment>
  </Idle>
  <Emote_Sit>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Animation name="sit_down"/>
     <Blend ExitTime="-1" StartTime="0" Duration="0.2"/>
     <Animation name="sit_loop" flags="Loop"/>
    </AnimLayer>
   </Fragment>
  </Emote_Sit>
  <Look>
   <Fragment BlendOutDuration="0.2" Tags=""><AnimLayer><Animation name="look" flags="Loop"/></AnimLayer></Fragment>
  </Look>
  <Wave>
   <Fragment BlendOutDuration="0.5" Tags="">
    <AnimLayer><Animation name="wave"/></AnimLayer>
   </Fragment>
  </Wave>
  <Swing>
   <Fragment BlendOutDuration="0.2" Tags="Sword"><AnimLayer><Animation name="swing_sword"/></AnimLayer></Fragment>
   <Fragment BlendOutDuration="0.2" Tags="Sword"><AnimLayer><Animation name="swing_sword_b"/></AnimLayer></Fragment>
  </Swing>
 </FragmentList>
</AnimDB>`

/**
 * One second clips, except `sit_down` (2 s)
 */
function source(name: string): AnimationSource {
  return {
    duration: name === 'sit_down' ? 2 : 1,
    additive: false,
    createState: () => name,
    sample: () => {},
  }
}

function createController(random = () => 0, controllerXml = CONTROLLER) {
  const controller = parseControllerDefinition(controllerXml)
  const setup: MannequinSetup = {
    database: 'test.adb',
    controllerDefinition: 'test.xml',
    controller,
    tags: new MannequinTags([parseTagDefinition(TAGS)]),
    context: 'Char3P',
  }
  const rig = new AnimationRig({ names: ['root'], parents: [-1], defaultPose: new AnimationPose(1) })
  const mixer = new AnimationMixer(rig)
  const adb = parseAnimationDatabase(ADB)
  const names = new Map<AnimationSource, string>()
  const mannequin = new MannequinController(
    setup,
    {
      mixer,
      source: async (name) => {
        const it = source(name)
        names.set(it, name)
        return it
      },
      candidates: async (fragment): Promise<FragmentCandidate[]> =>
        adbFragmentVariants(adb, fragment).map((it) => ({ fragment: it, tags: it.tags })),
      transitions: async () => adb.blends,
    },
    random,
  )
  // the newest entry of a layer by animation name
  const playing = (layer: number) => {
    const entries = mixer.entries(layer)
    const newest = entries[entries.length - 1]
    return newest ? names.get(newest.source) : undefined
  }
  const step = (seconds: number, dt = 0.05) => {
    for (let t = 0; t < seconds - 1e-6; t += dt) {
      mannequin.update(dt)
      mixer.update(dt)
    }
  }
  return { mannequin, mixer, playing, step }
}

describe('TagState', () => {
  it('keeps one tag per group', () => {
    const state = new TagState(new MannequinTags([parseTagDefinition(TAGS)]))
    state.reset(['sword', 'Sitting'])
    state.toggle('Axe', true)
    expect(state.values()).toEqual(['Sitting', 'Axe'])
    expect(state.has('AXE')).toBe(true)
    state.toggle('axe', false)
    expect(state.values()).toEqual(['Sitting'])
  })
})

describe('fragmentScopes', () => {
  it('takes the override whose tags are set and skips other contexts', () => {
    const { mannequin } = createController()
    const scopes = (fragment: string) => fragmentScopes(mannequin.setup, fragment, mannequin.tags).map((it) => it.name)
    expect(scopes('Wave')).toEqual(['UpperBody'])
    mannequin.tags.toggle('Sitting', true)
    expect(scopes('Wave')).toEqual(['FullBody', 'UpperBody'])
    expect(scopes('Swing')).toEqual(['FullBody'])
    expect(scopes('Unknown')).toEqual([])
  })
})

describe('MannequinController', () => {
  it('installs each scope with its own tags: the Offhand scope takes the Offhand variant', async () => {
    const { mannequin, playing, step } = createController()
    expect(await mannequin.queue('Idle')).toBe(true)
    step(0.05)
    expect(playing(0)).toBe('idle')
    expect(playing(8)).toBe('offhand_idle')
    expect(mannequin.current).toMatchObject({ fragment: 'Idle', oneShot: false })
  })

  it('ends an action that loses one of its scopes, its other scopes blend out', async () => {
    const { mannequin, mixer, playing, step } = createController()
    await mannequin.queue('Idle')
    step(0.05)
    expect(playing(8)).toBe('offhand_idle')
    // Emote_Sit takes FullBody only: the Idle (FullBody+Offhand) leaves as a whole, its Offhand layer fades
    mannequin.idleFragment = ''
    mannequin.autoFinish = false
    await mannequin.queue('Emote_Sit')
    expect(mannequin.actions.map((it) => it.fragment)).toEqual(['Emote_Sit'])
    step(0.5)
    expect(playing(0)).toBe('sit_down')
    expect(mixer.entries(8).length).toBe(0)
  })

  it('requires the scope tags: a scope without its own variant blends out', async () => {
    const { mannequin, mixer, playing, step } = createController()
    await mannequin.queue('Idle')
    await mannequin.queue('Look')
    step(0.5)
    expect(playing(0)).toBe('look')
    expect(mixer.entries(8).length).toBe(0)
  })

  it('installs the next clip after the previous one when its exit time is negative', async () => {
    const { mannequin, mixer, playing, step } = createController()
    await mannequin.queue('Emote_Sit')
    step(0.05)
    expect(playing(0)).toBe('sit_down')
    expect(mixer.entries(0)[0].loop).toBe(false)
    step(1.8)
    expect(playing(0)).toBe('sit_down')
    step(0.3)
    expect(playing(0)).toBe('sit_loop')
    // the last clip loops: the fragment does not end
    expect(mannequin.current).toMatchObject({ fragment: 'Emote_Sit', duration: 2, oneShot: false })
  })

  it('hands a finished one shot over to the idle, scopes the idle does not cover blend out', async () => {
    const { mannequin, mixer, playing, step } = createController()
    await mannequin.queue('Idle')
    await mannequin.queue('Wave')
    step(0.05)
    expect(playing(4)).toBe('wave')
    expect(mannequin.actions.map((it) => it.fragment)).toEqual(['Idle', 'Wave'])
    // one second clip, blend out 0.5: finishes at 0.5 s
    step(0.5)
    expect(mannequin.actions.map((it) => it.fragment)).toEqual(['Idle'])
    step(0.6)
    expect(mixer.entries(4).length).toBe(0)
    expect(playing(0)).toBe('idle')
  })

  it('keeps a one shot idle installed on its last key', async () => {
    const { mannequin, mixer, playing, step } = createController()
    // the crawler's Idle plays a clip without Loop
    mannequin.idleFragment = 'Wave'
    await mannequin.queue('Wave')
    step(2)
    expect(mannequin.actions.map((it) => it.fragment)).toEqual(['Wave'])
    expect(playing(4)).toBe('wave')
    expect(mixer.entries(4)[0].time).toBe(1)
  })

  it('returns to the idle after a full body one shot', async () => {
    const { mannequin, playing, step } = createController()
    mannequin.tags.toggle('Sitting', true)
    await mannequin.queue('Wave')
    step(0.05)
    expect(playing(0)).toBe('wave')
    step(0.5)
    // the idle's request resolves in a microtask
    await Promise.resolve()
    await new Promise((resolve) => setTimeout(resolve, 0))
    step(0.1)
    expect(playing(0)).toBe('idle')
    expect(mannequin.current?.fragment).toBe('Idle')
  })

  it('picks one of equal variants at random and refuses fragments without a variant', async () => {
    const { mannequin, playing, step } = createController(() => 0.75)
    expect(await mannequin.queue('Swing')).toBe(false)
    mannequin.tags.toggle('Sword', true)
    expect(await mannequin.queue('Swing')).toBe(true)
    step(0.05)
    expect(playing(0)).toBe('swing_sword_b')
  })

  it('does not reinstall an AutoReinstall fragment over a request that is still loading on its scopes', async () => {
    const xml = CONTROLLER.replace(
      '<Idle scopes="FullBody+Offhand"/>',
      '<Idle scopes="FullBody+Offhand" flags="AutoReinstall"/>',
    )
    const { mannequin, step } = createController(() => 0, xml)
    expect(await mannequin.queue('Idle')).toBe(true)
    // the tag change would reinstall Idle with its Offhand variant, Look was asked for after it
    mannequin.tags.reset(['Offhand'])
    const look = mannequin.queue('Look')
    step(0.05)
    expect(await look).toBe(true)
    step(0.05)
    expect(mannequin.current?.fragment).toBe('Look')
  })

  it('blends out the scope layers a fragment leaves empty', async () => {
    const { mannequin, mixer, step } = createController()
    mixer.play(source('other'), { layer: 1 })
    await mannequin.queue('Idle')
    step(0.5)
    expect(mixer.entries(1).length).toBe(0)
  })
})
