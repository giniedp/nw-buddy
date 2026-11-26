import { describe, expect, it } from 'vitest'
import { findNodeView, NODE_VIEWS } from './registry'
import type { NodeView } from './types'

class Base {}
class Child extends Base {}
class GrandChild extends Child {}
class Other {}

const baseView: NodeView = { type: Base, icon: '', label: 'Base' }
const childView: NodeView = { type: Child, icon: '', label: 'Child' }

describe('findNodeView', () => {
  it('takes the view of the class', () => {
    expect(findNodeView([baseView, childView], Child)).toBe(childView)
  })

  it('takes the view of the closest base class', () => {
    expect(findNodeView([baseView, childView], GrandChild)).toBe(childView)
    expect(findNodeView([baseView], GrandChild)).toBe(baseView)
  })

  it('is null for classes without a view', () => {
    expect(findNodeView([baseView, childView], Other)).toBeNull()
    expect(findNodeView([baseView], undefined)).toBeNull()
  })
})

describe('NODE_VIEWS', () => {
  it('has one view per class', () => {
    const types = NODE_VIEWS.map((it) => it.type)
    expect(new Set(types).size).toBe(types.length)
  })
})
