import type { AnimationRig, AnimationTrackClip } from '@gglib/model'
import {
  getCharacterAnimationsUrl,
  getCharacterDatabasesUrl,
  type CharacterAnimationFile,
  type CharacterAnimationSet,
  type CharacterDatabase,
  type ViewerTimelineLayer,
} from '../../api'
import type { ContentService } from '../../content'
import { parseBlendSpace } from '../../formats/bspace'
import {
  parseActionGrid,
  parseActionList,
  parseInputProfile,
  type CageActionListDocument,
  type CageGridDocument,
  type InputProfileDocument,
} from '../../formats/cage'
import { parseCaf } from '../../formats/caf'
import { parseCgf } from '../../formats/cgf'
import {
  adbFragmentVariants,
  adbSubDatabases,
  parseAnimationDatabase,
  parseControllerDefinition,
  parseTagDefinition,
  type AdbDocument,
  type AdbFragmentBlend,
  type FragmentCandidate,
  type MannequinControllerDefinition,
  type MannequinTagDefinition,
} from '../../formats/mannequin'
import { prepareBlendSpace, type PreparedBlendSpace } from './blendSpace'
import { MannequinTags, type MannequinSetup } from './mannequin/setup'
import { createCafClip, createCharacterRig } from './rig'

/**
 * Loads and shares the animation data of characters: animation sets, rigs (one per `.chr`) and clips (one per `.caf`)
 *
 * @remarks
 * CPU data only. Characters of one kind share the rig and the clips, rigs keep the clip bindings. Kept for the
 * session, a failed load is not retried.
 */
export class CharacterAssets {
  private readonly content: ContentService
  private readonly sets = new Map<string, Promise<CharacterAnimationSet>>()
  private readonly characterDatabases = new Map<string, Promise<CharacterDatabase[]>>()
  private readonly rigs = new Map<string, Promise<AnimationRig>>()
  private readonly clips = new Map<string, Promise<AnimationTrackClip>>()
  private readonly databases = new Map<string, Promise<AdbDocument>>()
  private readonly blendSpaces = new Map<string, Promise<PreparedBlendSpace>>()
  private readonly timelines = new Map<string, Promise<unknown>>()
  private readonly documents = new Map<string, Promise<unknown>>()
  private readonly animationNames = new WeakMap<CharacterAnimationSet, Map<string, CharacterAnimationFile>>()

  public constructor(content: ContentService) {
    this.content = content
  }

  /**
   * The animation set of a `.cdf` or `.chr`
   */
  public animationSet(model: string): Promise<CharacterAnimationSet> {
    const key = model.toLowerCase()
    let result = this.sets.get(key)
    if (!result) {
      result = this.content.fetchTypedRequest(getCharacterAnimationsUrl(model))
      this.sets.set(key, result)
    }
    return result
  }

  /**
   * Every animation database with how many of its fragments the character (`.cdf` or `.chr`) can play
   */
  public playableDatabases(model: string): Promise<CharacterDatabase[]> {
    const key = model.toLowerCase()
    let result = this.characterDatabases.get(key)
    if (!result) {
      result = this.content.fetchTypedRequest(getCharacterDatabasesUrl(model))
      this.characterDatabases.set(key, result)
    }
    return result
  }

  /**
   * The rig of a skeleton (`.chr`)
   */
  public rig(skeleton: string): Promise<AnimationRig> {
    const key = skeleton.toLowerCase()
    let result = this.rigs.get(key)
    if (!result) {
      result = this.fetchBuffer(skeleton).then((buffer) => {
        const cgf = parseCgf(buffer)
        if (!cgf.bones.length) {
          throw new Error(`${skeleton}: no bones`)
        }
        return createCharacterRig(cgf.bones)
      })
      this.rigs.set(key, result)
    }
    return result
  }

  /**
   * The clip of a `.caf` animation
   */
  public clip(animation: CharacterAnimationFile): Promise<AnimationTrackClip> {
    const key = animation.file.toLowerCase()
    let result = this.clips.get(key)
    if (!result) {
      result = this.fetchBuffer(animation.file).then((buffer) => createCafClip(animation.name, parseCaf(buffer)))
      this.clips.set(key, result)
    }
    return result
  }

  /**
   * A blend space (`.bspace` or `.comb`), prepared for sampling with its members (see {@link prepareBlendSpace})
   */
  public blendSpace(path: string): Promise<PreparedBlendSpace> {
    const key = path.toLowerCase()
    let result = this.blendSpaces.get(key)
    if (!result) {
      result = this.content
        .fetchFile(key)
        .then((res) => res.text())
        .then((xml) => prepareBlendSpace(key, parseBlendSpace(xml), (member) => this.blendSpace(member)))
      this.blendSpaces.set(key, result)
    }
    return result
  }

  /**
   * The clips of the slots of a blend space, by name in the animation set
   */
  public async blendSpaceClips(set: CharacterAnimationSet, space: PreparedBlendSpace): Promise<AnimationTrackClip[]> {
    return Promise.all(
      space.slots.map((slot) => {
        const file = this.animationByName(set, slot.animation)
        if (file?.type !== 'caf') {
          // the game refuses the start: "Missing blendspace example animation while starting playback"
          throw new Error(`${space.file}: missing example animation ${slot.animation}`)
        }
        return this.clip(file)
      }),
    )
  }

  /**
   * A Mannequin controller definition (`*_controllerdefs.xml`)
   */
  public controllerDefinition(path: string): Promise<MannequinControllerDefinition> {
    return this.document('controller', path, parseControllerDefinition)
  }

  /**
   * A tag definition and the definitions it imports, imports first (each once)
   */
  public async tagDefinitions(path: string, seen = new Set<string>()): Promise<MannequinTagDefinition[]> {
    const key = path.toLowerCase()
    if (!key || seen.has(key)) {
      return []
    }
    seen.add(key)
    const definition = await this.document('tags', key, parseTagDefinition)
    const result: MannequinTagDefinition[] = []
    for (const imported of definition.imports) {
      result.push(...(await this.tagDefinitions(imported, seen)))
    }
    result.push(definition)
    return result
  }

  /**
   * The Mannequin setup of a character's own scope context: database, controller definition and its tags
   */
  public mannequinSetup(database: string, controllerDefinition: string): Promise<MannequinSetup> {
    const key = `setup:${database.toLowerCase()}|${controllerDefinition.toLowerCase()}`
    let result = this.documents.get(key) as Promise<MannequinSetup> | undefined
    if (!result) {
      result = (async () => {
        const controller = await this.controllerDefinition(controllerDefinition)
        const tags = new MannequinTags(await this.tagDefinitions(controller.tags))
        return {
          database,
          controllerDefinition,
          controller,
          tags,
          context: controller.scopeContexts[0]?.name ?? '',
        }
      })()
      this.documents.set(key, result)
    }
    return result
  }

  /**
   * The controller definition of a database among candidate files: the one with the database's fragment and tag
   * definitions (303 of 305 game ADBs have exactly one). Null when none matches.
   */
  public async controllerDefinitionFor(database: string, candidates: string[]): Promise<string | null> {
    const adb = await this.database(database)
    const fragDef = adb.fragDef.toLowerCase()
    const tagDef = adb.tagDef.toLowerCase()
    for (const candidate of candidates) {
      try {
        const it = await this.controllerDefinition(candidate)
        if (it.fragments.toLowerCase() === fragDef && it.tags.toLowerCase() === tagDef) {
          return candidate
        }
      } catch {
        // not a controller definition
      }
    }
    return null
  }

  /**
   * A Mannequin animation database (`.adb`)
   */
  public database(path: string): Promise<AdbDocument> {
    const key = path.toLowerCase()
    let result = this.databases.get(key)
    if (!result) {
      result = this.content
        .fetchFile(key)
        .then((res) => res.text())
        .then(parseAnimationDatabase)
      this.databases.set(key, result)
    }
    return result
  }

  /**
   * The transitions (`FragmentBlendList`) of a database and of its sub databases whose tags are all set, the
   * database's first. A sub database that fails to load is skipped.
   */
  public async fragmentBlends(database: string, tags: string[]): Promise<AdbFragmentBlend[]> {
    const adb = await this.database(database)
    const state = new Set(tags.map((it) => it.toLowerCase()))
    const result = [...adb.blends]
    for (const sub of adb.subDatabases) {
      if (!sub.tags.every((it) => state.has(it.toLowerCase()))) {
        continue
      }
      try {
        result.push(...(await this.fragmentBlends(sub.file, tags)))
      } catch (err) {
        console.warn(`adb ${sub.file}: ${err instanceof Error ? err.message : String(err)}`)
      }
    }
    return result
  }

  /**
   * The variants of a fragment in a database and in the sub databases that apply under the tags, each with all the
   * tags it needs (see {@link selectFragmentVariant}). A sub database that fails to load is skipped.
   */
  public async fragmentCandidates(
    database: string,
    fragment: string,
    tags: string[],
    inherited: string[] = [],
  ): Promise<FragmentCandidate[]> {
    const adb = await this.database(database)
    const result = adbFragmentVariants(adb, fragment).map((it) => ({ fragment: it, tags: [...inherited, ...it.tags] }))
    for (const sub of adbSubDatabases(adb, fragment, tags)) {
      try {
        result.push(...(await this.fragmentCandidates(sub.file, fragment, tags, [...inherited, ...sub.tags])))
      } catch (err) {
        console.warn(`adb ${sub.file}: ${err instanceof Error ? err.message : String(err)}`)
      }
    }
    return result
  }

  /**
   * Every variant of a fragment in a database and in all its sub databases (whatever tags are set), one entry per
   * tag set: the variants with the same tags are options of one entry. In database order, sub databases after.
   */
  public async fragmentVariants(database: string, fragment: string): Promise<FragmentVariant[]> {
    const candidates = await this.allFragmentCandidates(database, fragment, [])
    const byKey = new Map<string, FragmentVariant>()
    for (const candidate of candidates) {
      const tags = uniqueNames(candidate.tags)
      const key = tags
        .map((it) => it.toLowerCase())
        .sort()
        .join('+')
      let variant = byKey.get(key)
      if (!variant) {
        variant = { tags, options: [] }
        byKey.set(key, variant)
      }
      variant.options.push(candidate)
    }
    return [...byKey.values()]
  }

  private async allFragmentCandidates(
    database: string,
    fragment: string,
    inherited: string[],
  ): Promise<FragmentCandidate[]> {
    const adb = await this.database(database)
    const name = fragment.toLowerCase()
    const result = adbFragmentVariants(adb, fragment).map((it) => ({ fragment: it, tags: [...inherited, ...it.tags] }))
    for (const sub of adb.subDatabases) {
      const listed = !sub.fragments.length || sub.fragments.some((it) => it.toLowerCase() === name)
      if (!listed) {
        continue
      }
      try {
        result.push(...(await this.allFragmentCandidates(sub.file, fragment, [...inherited, ...sub.tags])))
      } catch (err) {
        console.warn(`adb ${sub.file}: ${err instanceof Error ? err.message : String(err)}`)
      }
    }
    return result
  }

  /**
   * The file of an animation name (chrparams) in a set, without regard to case
   */
  public animationByName(set: CharacterAnimationSet, name: string): CharacterAnimationFile | null {
    let names = this.animationNames.get(set)
    if (!names) {
      names = new Map()
      for (const animation of set.animations) {
        const key = animation.name.toLowerCase()
        if (!names.has(key)) {
          names.set(key, animation)
        }
      }
      this.animationNames.set(set, names)
    }
    return names.get(name.toLowerCase()) ?? null
  }

  /**
   * The animation clips of a timeline layer (`AnimationClip` of a `TimelineLayer`), in timeline order
   */
  public async timelineClips(layer: ViewerTimelineLayer): Promise<TimelineAnimationClip[]> {
    const key = layer.timeline.toLowerCase()
    let doc = this.timelines.get(key)
    if (!doc) {
      // nwbt converts the object stream to json
      doc = this.content.fetchFile(`${key}.json`).then((res) => res.json())
      this.timelines.set(key, doc)
    }
    return timelineLayerClips(await doc, layer)
  }

  /**
   * A CAGE grid (`.grid`)
   */
  public actionGrid(path: string): Promise<CageGridDocument> {
    return this.document('grid', path, parseActionGrid)
  }

  /**
   * A CAGE action list (`.actionlist`)
   */
  public actionList(path: string): Promise<CageActionListDocument> {
    return this.document('actionlist', path, parseActionList)
  }

  /**
   * An input profile (`libs/config/defaultprofile.xml`, its includes)
   */
  public inputProfile(path: string): Promise<InputProfileDocument> {
    return this.document('inputprofile', path, parseInputProfile)
  }

  /**
   * A parsed text document, cached by kind and path
   */
  private document<T>(kind: string, path: string, parse: (text: string) => T): Promise<T> {
    const key = `${kind}:${path.toLowerCase()}`
    let result = this.documents.get(key) as Promise<T> | undefined
    if (!result) {
      result = this.content
        .fetchFile(path.toLowerCase())
        .then((res) => res.text())
        .then(parse)
      this.documents.set(key, result)
    }
    return result
  }

  private async fetchBuffer(path: string): Promise<ArrayBuffer> {
    const res = await this.content.fetchFile(path)
    return res.arrayBuffer()
  }
}

/**
 * The variants of a fragment that share one tag set (see {@link CharacterAssets.fragmentVariants})
 */
export interface FragmentVariant {
  /**
   * The tags the variant needs, the sub databases' included, first spelling kept
   */
  tags: string[]
  /**
   * The variants with these tags, the game picks one at random
   */
  options: FragmentCandidate[]
}

function uniqueNames(names: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const name of names) {
    const key = name.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      result.push(name)
    }
  }
  return result
}

/**
 * An animation clip of a timeline layer (AnimationClip), seconds on the timeline
 */
export interface TimelineAnimationClip {
  animation: string
  start: number
  end: number
  loop: boolean
  speed: number
  /**
   * Seconds into the animation to start at
   */
  animationStart: number
}

/**
 * The animation clips of a layer of a timeline document (the json of nwbt), the layer found by id or name
 */
export function timelineLayerClips(doc: unknown, layer: ViewerTimelineLayer): TimelineAnimationClip[] {
  const layers = azElements((doc as { layers?: unknown })?.layers) as Array<Record<string, unknown>>
  const found =
    layers.find((it) => layer.layerId && String(it.id).toLowerCase() === layer.layerId.toLowerCase()) ??
    layers.find((it) => String(it.name).toLowerCase() === layer.layer.toLowerCase())
  const result: TimelineAnimationClip[] = []
  for (const pointer of azElements(found?.clips)) {
    const clip = (pointer as { element?: Record<string, unknown> })?.element
    if (clip?.__type !== 'AnimationClip' || !clip.animationalias) {
      continue
    }
    const base = (clip.baseclass1 ?? {}) as Record<string, unknown>
    result.push({
      animation: String(clip.animationalias),
      start: Number(base.starttime ?? 0),
      end: Number(base.endtime ?? 0),
      loop: !!clip.loop,
      speed: Number(clip.playbackspeed ?? 1) || 1,
      animationStart: Number(clip.animationstarttime ?? 0),
    })
  }
  return result.sort((a, b) => a.start - b.start)
}

/**
 * The elements of an AZStd container in the nwbt json: `element` holds one item or an array of them
 */
function azElements(container: unknown): unknown[] {
  const element = (container as { element?: unknown })?.element
  if (element == null) {
    return []
  }
  return Array.isArray(element) ? element : [element]
}

/**
 * The fallback when a character has no Mannequin `Idle` clip (see CharacterComponent): a name ending in `idle` or
 * `idle_loop`, else any idle, else the first clip. Calm idles come first: intro, outro and combat idles only when no
 * other matches (`scorpion_intro_idle` is the still emerge pose, `scorpion_ambient_idle` the loop). Death, hit, turn
 * and mount clips are skipped. Only clips are picked: a blend space needs motion parameters to look idle.
 */
export function pickIdleAnimation(animations: CharacterAnimationFile[]): CharacterAnimationFile | null {
  const clips = animations.filter((it) => it.type === 'caf')
  const idles = clips.filter((it) => /idle/i.test(it.name) && !/death|dead|hit|turn|mount/i.test(it.name))
  const calm = idles.filter((it) => !/intro|outro|combat/i.test(it.name))
  for (const list of [calm, idles]) {
    const found = list.find((it) => /idle(_loop)?$/i.test(it.name))
    if (found) {
      return found
    }
  }
  return calm[0] ?? idles[0] ?? clips[0] ?? null
}
