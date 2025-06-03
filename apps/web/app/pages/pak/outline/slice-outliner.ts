import { ObjectTreeAdapter } from '../../../ui/file-tree'

export function dynamicSliceOutliner(source: string) {
  const entities = parseDynamicSlice(source)
  if (!entities?.length) {
    return null
  }
  return {
    items: entities,
    adapter: sliceTreeAdapter(entities),
  }
}

function parseDynamicSlice(source: string): Entity[] {
  if (!source) {
    return null
  }
  try {
    const data = JSON.parse(source)
    const sliceComponent = toArray(data['components']['element'])[0]
    const entities = toArray(sliceComponent['entities']['element'])
    return entities
  } catch (e) {
    console.error('Failed to parse JSON', e)
    return null
  }
}

function sliceTreeAdapter(entities: Entity[]): ObjectTreeAdapter<Entity> {
  return {
    id: (item) => String(item.id.id),
    name: (item) => item.name,
    parentId: (item) => {
      for (const comp of toArray(item.components.element)) {
        if (comp.__type === 'GameTransformComponent') {
          const id = comp['m_parentid']?.['id']
          if (findEntityById(entities, String(id))) {
            return String(id)
          }
        }
      }
      return null
    },
    match: (item, search) => {
      return item.name.toLowerCase().includes(search)
    },
  }
}

function findEntityById(entities: Entity[], id: string): Entity {
  for (const entity of entities) {
    if (String(entity.id.id) === id) {
      return entity
    }
  }
  return null
}

export interface Entity {
  __type: string
  id: {
    __type: string
    id: string
  }
  name: string
  components: EntityComponents
}

export interface EntityComponents {
  __type: string
  element: Array<any>
}

function toArray<T>(obj: T | T[]): T[] {
  if (Array.isArray(obj)) {
    return obj
  }
  if (!obj) {
    return []
  }
  return [obj]
}

export function entityComponentNames(entity: Entity): string[] {
  if (!entity) {
    return null
  }
  return toArray(entity.components.element).map((it) => it.__type).filter((it) => !!it)
}
