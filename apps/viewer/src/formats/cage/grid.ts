import { parseXmlRoot, xmlAttr, xmlBool, xmlChild, xmlChildren } from '../xml/cryXml'
import { readCageNode, type CageNode } from './nodes'
import { splitTags } from '../mannequin/tags'

/**
 * How an incoming action takes the scopes of the action it replaces (`ScopeBehavior`, default `Moderate`)
 */
export type CageScopeBehavior = 'Aggressive' | 'Moderate' | 'Passive'

/**
 * A `<Rule>` of a grid's `<TransitionRules>`
 */
export interface CageGridRule {
  /**
   * Alias names, `*` for all
   */
  from: string[]
  to: string[]
  /**
   * `Always` / `Never`, null when the rule allows the transition (conditionally when it carries a condition)
   */
  transition: 'Always' | 'Never' | null
  scopeBehavior: CageScopeBehavior
  condition: CageNode | null
  bufferCondition: CageNode | null
}

/**
 * An `<AliasMap>` entry: the action of a list the grid builds, under its alias
 */
export interface CageGridAliasEntry {
  action: string
  alias: string
  /**
   * `IsIgnoredByGrid`: no cell rules on the action, it ranks above everything
   */
  ignoredByGrid: boolean
}

/**
 * An `<ActionList>` reference of a grid
 */
export interface CageGridListReference {
  path: string
  /**
   * `WeaponRequirements` (`Bow`, `Ranged+Magic+Spear+Hatchet`): item classes of which the equipped weapon needs one
   */
  weaponRequirements: string[]
  /**
   * `StackVar`: a configuration flag the list loads under, null when none
   */
  stackVar: string | null
  aliasMap: CageGridAliasEntry[]
}

/**
 * A `.grid` document (CAGE `CharacterActionGrid`)
 */
export interface CageGridDocument {
  aliases: string[]
  rules: CageGridRule[]
  actionLists: CageGridListReference[]
  /**
   * Lists whose named conditions are virtual inputs
   */
  virtualInputLists: string[]
  reactionTables: string[]
}

/**
 * Parses a `<Grid>` document
 */
export function parseActionGrid(xml: string): CageGridDocument {
  const root = parseXmlRoot(xml, 'Grid')
  return {
    aliases: xmlChildren(xmlChild(root, 'Aliases'), 'Alias').map((it) => xmlAttr(it, 'Name') ?? ''),
    rules: xmlChildren(xmlChild(root, 'TransitionRules'), 'Rule').map(readRule),
    actionLists: xmlChildren(xmlChild(root, 'ActionLists'), 'ActionList').map((it) => ({
      path: xmlAttr(it, 'Path') ?? '',
      weaponRequirements: splitTags(xmlAttr(it, 'WeaponRequirements')),
      stackVar: xmlAttr(it, 'StackVar') || null,
      aliasMap: xmlChildren(xmlChild(it, 'AliasMap'), 'Action').map((entry) => ({
        action: xmlAttr(entry, 'ActionName') ?? '',
        alias: xmlAttr(entry, 'Alias') ?? '',
        ignoredByGrid: xmlBool(entry, 'IsIgnoredByGrid') ?? false,
      })),
    })),
    virtualInputLists: listPaths(xmlChild(root, 'VirtualInputLists')),
    reactionTables: listPaths(xmlChild(root, 'ReactionTables')),
  }
}

function readRule(el: Element): CageGridRule {
  const transition = xmlAttr(el, 'Transition')
  const behavior = xmlAttr(el, 'ScopeBehavior')
  return {
    from: splitList(xmlAttr(el, 'From')),
    to: splitList(xmlAttr(el, 'To')),
    transition: transition === 'Always' || transition === 'Never' ? transition : null,
    scopeBehavior: behavior === 'Aggressive' || behavior === 'Passive' ? behavior : 'Moderate',
    condition: lastChild(xmlChild(el, 'Condition')),
    bufferCondition: lastChild(xmlChild(el, 'BufferCondition')),
  }
}

function listPaths(el: Element | null): string[] {
  return xmlChildren(el, 'ActionList')
    .map((it) => xmlAttr(it, 'Path') ?? '')
    .filter((it) => !!it)
}

function splitList(text: string | null): string[] {
  return (text ?? '')
    .split(',')
    .map((it) => it.trim())
    .filter((it) => !!it)
}

function lastChild(el: Element | null): CageNode | null {
  const children = xmlChildren(el)
  const last = children[children.length - 1]
  return last ? readCageNode(last) : null
}

/**
 * A cell of the grid: whether the action of the row's alias may be replaced by one of the column's alias
 */
export interface CageGridCell {
  /**
   * `conditional`: allowed when the condition holds; a holding buffer condition buffers the transition
   */
  kind: 'always' | 'never' | 'conditional'
  scopeBehavior: CageScopeBehavior
  condition: CageNode | null
  bufferCondition: CageNode | null
}

const NEVER: CageGridCell = { kind: 'never', scopeBehavior: 'Moderate', condition: null, bufferCondition: null }
const OPEN: CageGridCell = { kind: 'always', scopeBehavior: 'Moderate', condition: null, bufferCondition: null }

export class CageGridCells {
  public readonly aliases: string[]
  /**
   * Alias names a rule names that the grid does not declare (the game refuses such a grid; the viewer skips them)
   */
  public readonly unknownAliases: string[] = []
  private readonly index = new Map<string, number>()
  private readonly cells: CageGridCell[]

  public constructor(grid: CageGridDocument) {
    this.aliases = grid.aliases
    grid.aliases.forEach((it, i) => this.index.set(it.toLowerCase(), i))
    const count = grid.aliases.length
    this.cells = new Array<CageGridCell>(count * count).fill(NEVER)
    const touched = new Uint8Array(count)
    for (const rule of grid.rules) {
      const cell = ruleCell(rule)
      for (const from of this.expand(rule.from)) {
        if (!touched[from]) {
          touched[from] = 1
          this.cells.fill(OPEN, from * count, (from + 1) * count)
        }
        for (const to of this.expand(rule.to)) {
          this.cells[from * count + to] = cell
        }
      }
    }
  }

  /**
   * The index of an alias (any case), -1 when the grid does not declare it
   */
  public aliasIndex(alias: string): number {
    return this.index.get(alias.toLowerCase()) ?? -1
  }

  /**
   * The cell from the alias of the playing action to the alias of the incoming one, by index
   */
  public cell(from: number, to: number): CageGridCell {
    const count = this.aliases.length
    if (from < 0 || to < 0 || from >= count || to >= count) {
      return NEVER
    }
    return this.cells[from * count + to]
  }

  private expand(names: string[]): number[] {
    const result: number[] = []
    for (const name of names) {
      if (name === '*') {
        for (let i = 0; i < this.aliases.length; i++) {
          result.push(i)
        }
        continue
      }
      const index = this.aliasIndex(name)
      if (index < 0) {
        if (!this.unknownAliases.includes(name)) {
          this.unknownAliases.push(name)
        }
        continue
      }
      result.push(index)
    }
    return result
  }
}

function ruleCell(rule: CageGridRule): CageGridCell {
  if (rule.transition === 'Always') {
    return { ...OPEN, scopeBehavior: rule.scopeBehavior }
  }
  if (rule.transition === 'Never') {
    return NEVER
  }
  if (rule.condition || rule.bufferCondition) {
    return {
      kind: 'conditional',
      scopeBehavior: rule.scopeBehavior,
      condition: rule.condition,
      bufferCondition: rule.bufferCondition,
    }
  }
  return { ...OPEN, scopeBehavior: rule.scopeBehavior }
}
