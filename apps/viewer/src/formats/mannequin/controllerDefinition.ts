import { parseXmlRoot, xmlAttr, xmlChild, xmlChildren, xmlNumber } from '../xml/cryXml'
import { splitTags } from './tags'

/**
 * A fragment of a controller definition: the scopes it installs on
 */
export interface MannequinFragmentDefinition {
  name: string
  /**
   * Scope names, e.g. `FullBody`, `FullBody+Weapon`
   */
  scopes: string[]
  /**
   * Fragment flags, e.g. `AutoReinstall`, `Persistent`, `TimewarpAutoReinstall`
   */
  flags: string[]
  /**
   * Other scopes for some tags: the first override whose tags are all set wins
   */
  overrides: Array<{ tags: string[]; fragTags: string[]; scopes: string[] }>
}

/**
 * A scope: a range of animation layers on the character of its context
 */
export interface MannequinScopeDefinition {
  name: string
  /**
   * The first animation layer (of 16)
   */
  layer: number
  numLayers: number
  /**
   * The scope context, e.g. `Char3P`, `WeaponContext`, `Audio`
   */
  context: string
  alias: string
  tags: string[]
}

/**
 * A `<ControllerDef>`: tags, fragments and scopes of a Mannequin controller (e.g. `*_controllerdefs.xml`)
 */
export interface MannequinControllerDefinition {
  /**
   * The tag definition file
   */
  tags: string
  /**
   * The fragment id definition file (a tag definition)
   */
  fragments: string
  fragmentDefinitions: MannequinFragmentDefinition[]
  /**
   * Scope contexts with the tags they add and share
   */
  scopeContexts: Array<{ name: string; tags: string[]; sharedTags: string[] }>
  scopes: MannequinScopeDefinition[]
  subContexts: Array<{ name: string; scopes: string[]; tags: string[] }>
}

/**
 * Parses a `<ControllerDef>` file
 */
export function parseControllerDefinition(xml: string): MannequinControllerDefinition {
  const root = parseXmlRoot(xml, 'ControllerDef')
  return {
    tags: fileName(xmlChild(root, 'Tags')),
    fragments: fileName(xmlChild(root, 'Fragments')),
    fragmentDefinitions: xmlChildren(xmlChild(root, 'FragmentDefs')).map((it) => ({
      name: it.nodeName,
      scopes: splitTags(xmlAttr(it, 'scopes')),
      flags: splitTags(xmlAttr(it, 'flags')),
      overrides: xmlChildren(it, 'Override').map((override) => ({
        tags: splitTags(xmlAttr(override, 'tags')),
        fragTags: splitTags(xmlAttr(override, 'fragTags')),
        scopes: splitTags(xmlAttr(override, 'scopes')),
      })),
    })),
    scopeContexts: xmlChildren(xmlChild(root, 'ScopeContextDefs')).map((it) => ({
      name: it.nodeName,
      tags: splitTags(xmlAttr(it, 'tags')),
      sharedTags: splitTags(xmlAttr(it, 'sharedTags')),
    })),
    scopes: xmlChildren(xmlChild(root, 'ScopeDefs')).map((it) => ({
      name: it.nodeName,
      layer: xmlNumber(it, 'layer') ?? 0,
      numLayers: xmlNumber(it, 'numLayers') ?? 0,
      context: xmlAttr(it, 'context') ?? '',
      alias: xmlAttr(it, 'scopeAlias') ?? '',
      tags: splitTags(xmlAttr(it, 'Tags')),
    })),
    subContexts: xmlChildren(xmlChild(root, 'SubContexts')).map((it) => ({
      name: it.nodeName,
      scopes: splitTags(xmlAttr(it, 'scopes')),
      tags: splitTags(xmlAttr(it, 'tags')),
    })),
  }
}

function fileName(el: Element | null): string {
  return el ? (xmlAttr(el, 'filename') ?? '') : ''
}
