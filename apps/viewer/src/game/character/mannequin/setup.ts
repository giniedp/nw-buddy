import type {
  MannequinControllerDefinition,
  MannequinFragmentDefinition,
  MannequinScopeDefinition,
  MannequinTagDefinition,
} from '../../../formats/mannequin'

/**
 * The tags of a Mannequin setup: all tags in id order, and the groups of which at most one tag is set
 */
export class MannequinTags {
  /**
   * Tag names as authored, imports first
   */
  public readonly names: string[] = []
  public readonly groups: Array<{ name: string; tags: string[] }> = []
  private readonly groupOf = new Map<string, number>()
  private readonly byKey = new Map<string, string>()

  /**
   * @param definitions - the tag definition and its imports, imports first
   */
  public constructor(definitions: MannequinTagDefinition[]) {
    for (const definition of definitions) {
      for (const entry of definition.entries) {
        if (entry.kind === 'tag') {
          this.add(entry.name, -1)
          continue
        }
        const group = this.groups.length
        this.groups.push({ name: entry.name, tags: entry.tags.map((it) => it.name) })
        for (const tag of entry.tags) {
          this.add(tag.name, group)
        }
      }
    }
  }

  /**
   * The tag as authored, null for a name the setup does not have
   */
  public name(tag: string): string | null {
    return this.byKey.get(tag.toLowerCase()) ?? null
  }

  /**
   * The group index of a tag, -1 without one
   */
  public group(tag: string): number {
    return this.groupOf.get(tag.toLowerCase()) ?? -1
  }

  private add(name: string, group: number) {
    const key = name.toLowerCase()
    if (!this.byKey.has(key)) {
      this.names.push(name)
      this.byKey.set(key, name)
    }
    if (group >= 0) {
      this.groupOf.set(key, group)
    }
  }
}

/**
 * The tags set on a Mannequin controller (Cry `SFragTagState`): setting a tag of a group clears the other tags of the
 * group. Tags compare without regard to case, names the setup does not know are kept as given.
 */
export class TagState {
  public readonly definition: MannequinTags
  /**
   * Counts the changes of the set tags
   */
  public version = 0
  private readonly set = new Map<string, string>()
  /**
   * Lower case key per tag spelling asked for (conditions test the same tags every step)
   */
  private readonly keys = new Map<string, string>()

  public constructor(definition: MannequinTags) {
    this.definition = definition
  }

  public has(tag: string): boolean {
    return this.set.has(this.key(tag))
  }

  /**
   * Sets or clears a tag. Setting a tag of a group clears the others of its group.
   */
  public toggle(tag: string, on: boolean) {
    const key = this.key(tag)
    if (!on) {
      if (this.set.delete(key)) {
        this.version++
      }
      return
    }
    if (this.set.has(key)) {
      return
    }
    const group = this.definition.group(tag)
    if (group >= 0) {
      for (const other of this.definition.groups[group].tags) {
        this.set.delete(other.toLowerCase())
      }
    }
    this.set.set(key, this.definition.name(tag) ?? tag)
    this.version++
  }

  /**
   * Clears all tags, then sets the given ones in order
   */
  public reset(tags: Iterable<string>) {
    this.version++
    this.set.clear()
    for (const tag of tags) {
      this.toggle(tag, true)
    }
  }

  /**
   * The set tags as authored
   */
  public values(): string[] {
    return [...this.set.values()]
  }

  private key(tag: string): string {
    let key = this.keys.get(tag)
    if (key === undefined) {
      key = tag.toLowerCase()
      this.keys.set(tag, key)
    }
    return key
  }
}

/**
 * The Mannequin data of a character's own scope context: its controller definition, tags and animation database
 */
export interface MannequinSetup {
  database: string
  controllerDefinition: string
  controller: MannequinControllerDefinition
  tags: MannequinTags
  /**
   * The scope context of the character itself, the first of the controller definition (e.g. `Char3P`). Scopes of
   * other contexts play on other characters (weapons, mounts) and are skipped.
   */
  context: string
}

/**
 * The definition of a fragment, by name without regard to case
 */
export function fragmentDefinition(setup: MannequinSetup, fragment: string): MannequinFragmentDefinition | null {
  const name = fragment.toLowerCase()
  return setup.controller.fragmentDefinitions.find((it) => it.name.toLowerCase() === name) ?? null
}

/**
 * The scopes a fragment installs on under a tag state, in the character's own context: the first override whose tags
 * are all set, else the fragment's scopes
 */
export function fragmentScopes(
  setup: MannequinSetup,
  fragment: string,
  tags: { has(tag: string): boolean },
): MannequinScopeDefinition[] {
  const definition = fragmentDefinition(setup, fragment)
  if (!definition) {
    return []
  }
  const override = definition.overrides.find((it) => it.tags.every((tag) => tags.has(tag)))
  const names = override?.scopes ?? definition.scopes
  const result: MannequinScopeDefinition[] = []
  for (const name of names) {
    const key = name.toLowerCase()
    const scope = setup.controller.scopes.find((it) => it.name.toLowerCase() === key)
    if (scope && scope.context === setup.context && scope.numLayers > 0) {
      result.push(scope)
    }
  }
  return result
}
