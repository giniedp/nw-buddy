import { describe, expect, it } from 'vitest'
import { routerLocation } from './ViewerApp'

describe('routerLocation', () => {
  it('takes locations below the base, without the base', () => {
    expect(routerLocation('/pak', '/pak/data/ItemData?key=a')).toBe('/data/ItemData?key=a')
    expect(routerLocation('/pak', '/pak?file=x')).toBe('?file=x')
    expect(routerLocation('/pak', '/pak')).toBe('/')
    expect(routerLocation('/de-de/pak', '/DE-DE/pak/browser')).toBe('/browser')
  })

  it('ignores locations outside the base', () => {
    expect(routerLocation('/pak', '/items/123')).toBeNull()
    expect(routerLocation('/pak', '/pakage')).toBeNull()
  })

  it('takes every location at the root', () => {
    expect(routerLocation('', '/viewer?level=x')).toBe('/viewer?level=x')
    expect(routerLocation('', '')).toBe('/')
  })
})
