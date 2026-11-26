import { parseXmlRoot, xmlAttr, xmlBool, xmlChild, xmlChildren, xmlNumber } from '../xml/cryXml'
import { readCageNode, type CageNode } from './nodes'

/**
 * An `<Action>` of an action list
 */
export interface CageActionDefinition {
  name: string
  /**
   * The Mannequin fragment the action plays, null when it installs on no scope
   */
  fragment: string | null
  /**
   * Signed `Priority`, 0 when not authored
   */
  priority: number
  predictive: boolean
  serverStarted: boolean
  /**
   * `Disabled`: the controller never builds the action
   */
  disabled: boolean
  /**
   * The condition that starts the action, null when none is authored (the action never starts itself)
   */
  activation: CageNode | null
  /**
   * The condition that ends the installed action, null when none is authored
   */
  deactivation: CageNode | null
  /**
   * The activities, in document order
   */
  activities: CageNode[]
}

/**
 * A named condition of a list's `<Conditions>`: `IfExternalCondition`, `Conditional` entries and (for virtual input
 * lists) inputs read it by name
 */
export interface CageNamedCondition {
  name: string
  condition: CageNode
}

/**
 * A `.actionlist` document (CAGE `CharacterActionList`)
 */
export interface CageActionListDocument {
  actions: CageActionDefinition[]
  conditions: CageNamedCondition[]
}

/**
 * Parses an `<ActionList>` document. Condition and activity trees stay generic {@link CageNode}s. The reaction table
 * blocks are not read.
 */
export function parseActionList(xml: string): CageActionListDocument {
  const root = parseXmlRoot(xml, 'ActionList')
  return {
    actions: xmlChildren(xmlChild(root, 'Actions'), 'Action').map(readAction),
    conditions: xmlChildren(xmlChild(root, 'Conditions'))
      .map((it) => ({ name: xmlAttr(it, 'Name') ?? '', condition: readCageNode(it) }))
      .filter((it) => !!it.name),
  }
}

function readAction(el: Element): CageActionDefinition {
  const fragment = xmlAttr(el, 'FragmentName')
  return {
    name: xmlAttr(el, 'Name') ?? '',
    fragment: fragment ? fragment : null,
    priority: xmlNumber(el, 'Priority') ?? 0,
    predictive: xmlBool(el, 'Predictive') ?? false,
    serverStarted: xmlBool(el, 'ServerStarted') ?? false,
    disabled: xmlBool(el, 'Disabled') ?? false,
    activation: lastChild(xmlChild(el, 'ActivationCondition')),
    deactivation: lastChild(xmlChild(el, 'DeactivationCondition')),
    activities: xmlChildren(xmlChild(el, 'Activities')).map(readCageNode),
  }
}

/**
 * The condition a slot holds: its last child, each replacing the one before (as the game's loaders read a wrapper)
 */
function lastChild(el: Element | null): CageNode | null {
  const children = xmlChildren(el)
  const last = children[children.length - 1]
  return last ? readCageNode(last) : null
}
