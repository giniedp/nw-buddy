import { parseXmlRoot, xmlAttr, xmlChild, xmlChildren, xmlNumber } from '../xml/cryXml'

/**
 * A tag of a tag definition
 */
export interface MannequinTag {
  kind: 'tag'
  name: string
  /**
   * Orders fragment variants: a variant with higher priority tags matches first. 0 when not authored.
   */
  priority: number
  /**
   * The tag definition of the fragment's own tags (FragTags), only in fragment definitions; empty without
   */
  subTagDef: string
}

/**
 * Tags of which at most one is set at a time
 */
export interface MannequinTagGroup {
  kind: 'group'
  name: string
  tags: MannequinTag[]
}

/**
 * A `<TagDefinition>`: the tags of a Mannequin setup (e.g. `*_tags.xml`), or its fragment ids (`*_actions.xml`)
 */
export interface MannequinTagDefinition {
  version: number
  /**
   * Imported tag definitions (version 2 `Imports/Import filename`), their tags come first
   */
  imports: string[]
  /**
   * Tags and groups in document order
   */
  entries: Array<MannequinTag | MannequinTagGroup>
}

/**
 * Parses a `<TagDefinition>` file, version 1 (tags as element names) and 2 (`Tags/Tag name`)
 */
export function parseTagDefinition(xml: string): MannequinTagDefinition {
  const root = parseXmlRoot(xml, 'TagDefinition')
  const version = xmlNumber(root, 'version') ?? 1
  if (version < 2) {
    return { version, imports: [], entries: xmlChildren(root).map(readVersion1Entry) }
  }
  return {
    version,
    imports: xmlChildren(xmlChild(root, 'Imports'), 'Import').map((it) => xmlAttr(it, 'filename') ?? ''),
    entries: xmlChildren(xmlChild(root, 'Tags')).map(readEntry),
  }
}

/**
 * All tags in id order: tags and the members of groups, as they appear
 */
export function tagDefinitionTags(definition: MannequinTagDefinition): MannequinTag[] {
  return definition.entries.flatMap((it) => (it.kind === 'group' ? it.tags : [it]))
}

function readEntry(el: Element): MannequinTag | MannequinTagGroup {
  if (el.nodeName === 'Group') {
    return { kind: 'group', name: xmlAttr(el, 'name') ?? '', tags: xmlChildren(el, 'Tag').map(readTag) }
  }
  return readTag(el)
}

function readTag(el: Element): MannequinTag {
  return {
    kind: 'tag',
    name: xmlAttr(el, 'name') ?? '',
    priority: xmlNumber(el, 'priority') ?? 0,
    subTagDef: xmlAttr(el, 'subTagDef') ?? '',
  }
}

/**
 * Version 1: an empty element is a tag named by the element, an element with children is a group of such tags
 */
function readVersion1Entry(el: Element): MannequinTag | MannequinTagGroup {
  const tag = (it: Element): MannequinTag => ({
    kind: 'tag',
    name: it.nodeName,
    priority: xmlNumber(it, 'priority') ?? 0,
    subTagDef: '',
  })
  if (el.children.length) {
    return { kind: 'group', name: el.nodeName, tags: xmlChildren(el).map(tag) }
  }
  return tag(el)
}
