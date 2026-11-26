import { parseXmlRoot, xmlAttr, xmlBool, xmlChild, xmlChildren, xmlNumber } from '../xml/cryXml'

/**
 * A dimension of a blend space: the motion parameter it reads and its range
 */
export interface BlendSpaceDimension {
  /**
   * The motion parameter, e.g. `MoveSpeed`, `TurnSpeed`, `TravelAngle`, `TravelSlope`, `TurnAngle`, `TravelDist`
   */
  name: string
  min: number
  max: number
  /**
   * Grid cells of the dimension, at least 3
   */
  cells: number
  /**
   * At least 0.01
   */
  scale: number
  jointName: string
  /**
   * Start and end key of the parameter extraction (fractions of the clip), null when not authored
   */
  skey: number | null
  ekey: number | null
  locked: boolean
  /**
   * Combined blend spaces: the factor of the parameter for the member blend spaces
   */
  paraScale: number | null
  /**
   * Combined blend spaces: keep only the member whose range is closest to the parameter
   */
  chooseBlendSpace: boolean
}

export interface BlendSpaceExample {
  /**
   * The animation name (`Example AName`), empty for a nested blend space
   */
  animation: string
  /**
   * The nested blend space file (`BlendExample aname`), empty for an animation
   */
  blendExample: string
  /**
   * Default 1
   */
  playbackScale: number
  /**
   * `SetPara0`..`SetPara3`: the authored position per dimension, null where the parameter is extracted from the clip
   */
  params: Array<number | null>
}

/**
 * An example blended from two others (`ExamplePseudo`), its indices are into the examples
 */
export interface BlendSpacePseudoExample {
  i0: number
  i1: number
  w0: number
  w1: number
}

/**
 * A corner of the precomputed virtual grid (`VGrid`): example indices and their weights
 */
export interface BlendSpaceVirtualExample {
  indices: number[]
  weights: number[]
}

/**
 * A `.bspace` (`ParaGroup`)
 */
export interface ParaGroupBlendSpace {
  kind: 'paragroup'
  /**
   * At most 3
   */
  dimensions: BlendSpaceDimension[]
  /**
   * Motion parameters extracted besides the dimensions (`AdditionalExtraction`)
   */
  additionalExtraction: string[]
  examples: BlendSpaceExample[]
  pseudoExamples: BlendSpacePseudoExample[]
  /**
   * The blendable faces (`Blendable/Face p0..p7`), indices into examples then pseudo examples
   */
  faces: number[][]
  /**
   * The precomputed grid, one corner per cell, x fastest. Null when missing or when its size does not match the
   * cells of the dimensions (the game then builds it).
   */
  virtualGrid: BlendSpaceVirtualExample[] | null
  /**
   * The joints the blend space animates (`JointList`), empty for all
   */
  jointList: string[]
  /**
   * `THRESHOLD tz`, null when not authored
   */
  threshold: number | null
  /**
   * `RAMPZ tx`, null when not authored
   */
  rampZ: number | null
  /**
   * `VEGPARAMS Idle2Move`
   */
  idleToMove: boolean
  /**
   * `TimewarpGroup name`, empty without
   */
  timewarpGroup: string
}

/**
 * A `.comb` (`CombinedBlendSpace`): member blend spaces blended with shared parameters
 */
export interface CombinedBlendSpace {
  kind: 'combined'
  /**
   * At most 4
   */
  dimensions: BlendSpaceDimension[]
  additionalExtraction: string[]
  /**
   * The member `.bspace` files
   */
  blendSpaces: string[]
  jointList: string[]
}

export type BlendSpace = ParaGroupBlendSpace | CombinedBlendSpace

/**
 * Parses a `.bspace` or `.comb` file
 */
export function parseBlendSpace(xml: string): BlendSpace {
  const root = parseXmlRoot(xml)
  if (root.nodeName === 'ParaGroup') {
    return parseParaGroup(root)
  }
  if (root.nodeName === 'CombinedBlendSpace') {
    return parseCombined(root)
  }
  throw new Error(`Not a blend space: <${root.nodeName}>`)
}

function parseParaGroup(root: Element): ParaGroupBlendSpace {
  const dimensions = xmlChildren(xmlChild(root, 'Dimensions'), 'Param').map(readDimension)
  const examples = xmlChildren(xmlChild(root, 'ExampleList')).map(readExample)
  const pseudoExamples = xmlChildren(xmlChild(root, 'ExamplePseudo'), 'Pseudo').map((it) => ({
    i0: xmlNumber(it, 'p0') ?? -1,
    i1: xmlNumber(it, 'p1') ?? -1,
    w0: xmlNumber(it, 'w0') ?? 1,
    w1: xmlNumber(it, 'w1') ?? 1,
  }))
  const highest = Math.max(0, examples.length + pseudoExamples.length - 1)
  const faces = xmlChildren(xmlChild(root, 'Blendable'), 'Face').map((face) => {
    const result: number[] = []
    for (let point = 0; point < 8; point++) {
      const index = xmlNumber(face, `p${point}`)
      if (index !== null) {
        result.push(Math.min(index, highest))
      }
    }
    return result
  })
  const timewarp = xmlChildren(root).find((it) => it.nodeName.toLowerCase() === 'timewarpgroup')
  const vegParams = xmlChild(root, 'VEGPARAMS')
  return {
    kind: 'paragroup',
    dimensions,
    additionalExtraction: readExtraction(root),
    examples,
    pseudoExamples,
    faces,
    virtualGrid: readVirtualGrid(xmlChild(root, 'VGrid'), dimensions),
    jointList: readJointList(root),
    threshold: maybe(xmlChild(root, 'THRESHOLD'), 'tz'),
    rampZ: maybe(xmlChild(root, 'RAMPZ'), 'tx'),
    idleToMove: !!vegParams && !!xmlNumber(vegParams, 'Idle2Move'),
    timewarpGroup: timewarp ? (xmlAttr(timewarp, 'name') ?? '') : '',
  }
}

function parseCombined(root: Element): CombinedBlendSpace {
  return {
    kind: 'combined',
    dimensions: xmlChildren(xmlChild(root, 'Dimensions'), 'Param').map(readDimension),
    additionalExtraction: readExtraction(root),
    blendSpaces: xmlChildren(xmlChild(root, 'BlendSpaces'), 'BlendSpace').map((it) => xmlAttr(it, 'aname') ?? ''),
    jointList: readJointList(root),
  }
}

function readDimension(param: Element): BlendSpaceDimension {
  return {
    name: xmlAttr(param, 'name') ?? '',
    min: xmlNumber(param, 'min') ?? 0,
    max: xmlNumber(param, 'max') ?? 0,
    cells: Math.max(3, xmlNumber(param, 'cells') ?? 0),
    scale: Math.max(0.01, xmlNumber(param, 'scale') ?? 1),
    jointName: xmlAttr(param, 'JointName') ?? '',
    skey: xmlNumber(param, 'skey'),
    ekey: xmlNumber(param, 'ekey'),
    locked: !!xmlNumber(param, 'locked'),
    paraScale: xmlNumber(param, 'ParaScale'),
    chooseBlendSpace: !!xmlBool(param, 'ChooseBlendSpace'),
  }
}

function readExample(el: Element): BlendSpaceExample {
  const nested = el.nodeName === 'BlendExample'
  const params: Array<number | null> = []
  for (let lane = 0; lane < 4; lane++) {
    params.push(xmlNumber(el, `SetPara${lane}`))
  }
  return {
    animation: nested ? '' : (xmlAttr(el, 'AName') ?? ''),
    blendExample: nested ? (xmlAttr(el, 'aname') ?? '') : '',
    playbackScale: xmlNumber(el, 'PlaybackScale') ?? 1,
    params,
  }
}

function readExtraction(root: Element): string[] {
  return xmlChildren(xmlChild(root, 'AdditionalExtraction'), 'Param').map((it) => xmlAttr(it, 'name') ?? '')
}

function readJointList(root: Element): string[] {
  return xmlChildren(xmlChild(root, 'JointList'), 'Joint').map((it) => xmlAttr(it, 'Name') ?? '')
}

/**
 * The virtual grid when its size matches the cells of the dimensions (NewWorld+0x6f045a0)
 */
function readVirtualGrid(grid: Element | null, dimensions: BlendSpaceDimension[]): BlendSpaceVirtualExample[] | null {
  const examples = xmlChildren(grid, 'VExample')
  if (!examples.length || !dimensions.length || dimensions.length > 3) {
    return null
  }
  const expected = dimensions.reduce((count, it) => count * it.cells, 1)
  if (examples.length !== expected) {
    return null
  }
  const lanes = 1 << dimensions.length
  return examples.map((example) => {
    const indices: number[] = []
    const weights: number[] = []
    for (let lane = 0; lane < lanes; lane++) {
      indices.push(xmlNumber(example, `i${lane}`) ?? 0)
      weights.push(xmlNumber(example, `w${lane}`) ?? 0)
    }
    return { indices, weights }
  })
}

function maybe(el: Element | null, name: string): number | null {
  return el ? xmlNumber(el, name) : null
}
