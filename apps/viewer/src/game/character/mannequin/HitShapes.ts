import { mat4$initFrom, mat4$multiply, mat4Identity, vec3, type Mat4 } from '@gglib/math'
import type { AdbProcedural } from '../../../formats/mannequin'
import { DebugLayer, type DebugShapeComponent, type DebugShapeEntry } from '../../debug/DebugShapeComponent'
import { hitShapeFrame, hitShapeOf, hitShapePrimitives, type HitShape } from './hitShape'
import { timelineBarAt, type FragmentTimeline } from './timeline'

/**
 * The joints of a character for {@link HitShapes}: frames in the game axes (Z up, +Y forward), in the space of the
 * debug shape component's entity
 */
export interface HitShapeJoints {
  /**
   * The joint of a lower case name, -1 when the character has none
   */
  find(name: string): number
  /**
   * Writes a joint's frame at the current pose
   */
  joint(index: number, out: Mat4): Mat4
  /**
   * Writes the character root's frame, the space of shapes without a joint
   */
  root(out: Mat4): Mat4
}

/**
 * Color of the hit shapes, as the damage bars of the track bar
 */
const HIT_COLOR = vec3(1, 0.25, 0.2)

type PrimitiveType = 'sphere' | 'box' | 'cylinder'

interface Primitives {
  entry: DebugShapeEntry
  /**
   * The instances drawn, the first entries of {@link pool}
   */
  list: Mat4[]
  pool: Mat4[]
}

/**
 * The melee hit shapes (`CAGE-Damage`) of the running bars of a fragment as debug shapes on {@link DebugLayer.Hitboxes},
 * on top of the model: at the joint they follow, or the character root without one. Shapes whose joint the character
 * does not have (weapon or other creatures' joints) are skipped.
 */
export class HitShapes {
  private readonly debug: DebugShapeComponent
  private readonly joints: HitShapeJoints
  private readonly shapes = new WeakMap<AdbProcedural, { shape: HitShape; joint: number } | null>()
  private readonly timelines = new WeakMap<FragmentTimeline, boolean>()
  private readonly primitives: Record<PrimitiveType, Primitives>
  private readonly frame = mat4Identity()
  private readonly emit = (type: PrimitiveType, local: Mat4) => {
    this.add(type, local)
  }
  private visible = false

  public constructor(debug: DebugShapeComponent, joints: HitShapeJoints) {
    this.debug = debug
    this.joints = joints
    const visibleIf = () => this.visible
    const create = (type: PrimitiveType): Primitives => {
      const list: Mat4[] = []
      const entry = debug.add({
        layer: DebugLayer.Hitboxes,
        type,
        color: HIT_COLOR,
        instances: list,
        onTop: true,
        visibleIf,
      })
      return { entry, list, pool: [] }
    }
    this.primitives = { sphere: create('sphere'), box: create('box'), cylinder: create('cylinder') }
  }

  /**
   * Draws the shapes, off by default
   */
  public get enabled(): boolean {
    return this.visible
  }
  public set enabled(value: boolean) {
    this.visible = value
  }

  /**
   * Whether a fragment has a shape to draw
   */
  public has(timeline: FragmentTimeline | null): boolean {
    if (!timeline) {
      return false
    }
    let result = this.timelines.get(timeline)
    if (result === undefined) {
      result = timeline.procLayers.some((bars) => {
        return bars.some((bar) => !!bar.procedural && !!this.resolve(bar.procedural))
      })
      this.timelines.set(timeline, result)
    }
    return result
  }

  /**
   * Places the shapes of the bars running at a time on the timeline, call after the joints are posed
   */
  public update(timeline: FragmentTimeline | null, time: number) {
    for (const type in this.primitives) {
      this.primitives[type as PrimitiveType].list.length = 0
    }
    if (!timeline || !this.visible) {
      return
    }
    for (const bars of timeline.procLayers) {
      const index = timelineBarAt(bars, time)
      const procedural = index >= 0 ? bars[index].procedural : null
      const resolved = procedural ? this.resolve(procedural) : null
      if (!resolved) {
        continue
      }
      if (resolved.joint >= 0) {
        this.joints.joint(resolved.joint, this.frame)
      } else {
        this.joints.root(this.frame)
      }
      mat4$multiply(this.frame, hitShapeFrame(resolved.shape, shapeFrame))
      hitShapePrimitives(resolved.shape, this.emit)
    }
  }

  /**
   * Removes the shapes from the debug component
   */
  public dispose() {
    for (const type in this.primitives) {
      this.debug.remove(this.primitives[type as PrimitiveType].entry)
    }
  }

  /**
   * The shape of a procedural and its joint (-1: the root), null when it has none to draw here
   */
  private resolve(procedural: AdbProcedural): { shape: HitShape; joint: number } | null {
    let result = this.shapes.get(procedural)
    if (result === undefined) {
      const shape = hitShapeOf(procedural)
      const joint = shape?.joint ? this.joints.find(shape.joint.toLowerCase()) : -1
      result = shape && (!shape.joint || joint >= 0) ? { shape, joint } : null
      this.shapes.set(procedural, result)
    }
    return result
  }

  private add(type: PrimitiveType, local: Mat4) {
    const primitives = this.primitives[type]
    const index = primitives.list.length
    if (index >= primitives.pool.length) {
      primitives.pool.push(mat4Identity())
    }
    const m = mat4$initFrom(primitives.pool[index], this.frame)
    primitives.list.push(mat4$multiply(m, local))
  }
}

const shapeFrame = mat4Identity()
