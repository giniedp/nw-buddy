import { contains, endsWith, equals, greaterThan, isIn, startsWith } from './operators'

describe('ui / expression-tree / operators', () => {
  describe('equials', () => {
    const table = [
      { a: false, b: '', expected: true },
      { a: true, b: '', expected: false },
      { a: null, b: '', expected: true },
      { a: undefined, b: '', expected: true },
      { a: '', b: '', expected: true },
      { a: false, b: '0', expected: true },
      { a: true, b: '0', expected: false },
      { a: null, b: '0', expected: true },
      { a: undefined, b: '0', expected: true },
      { a: 0, b: '0', expected: true },
      { a: '0', b: '0', expected: true },
      { a: false, b: '1', expected: false },
      { a: true, b: '1', expected: true },
      { a: true, b: '2', expected: false },
      { a: null, b: '1', expected: false },
      { a: undefined, b: '1', expected: false },
      { a: 0, b: '1', expected: false },
      { a: '0', b: '1', expected: false },
      { a: ['0'], b: '0', expected: true },
      { a: [0], b: '0', expected: true },
      { a: ['1'], b: '1', expected: true },
      { a: [1], b: '1', expected: true },
      { a: ['1', '1'], b: '1', expected: false },
      { a: [1, 1], b: '1', expected: false },
    ]
    for (const { a, b, expected } of table) {
      it(`should return ${expected} for ${JSON.stringify(a)} == ${JSON.stringify(b)}`, () => {
        expect(equals(a, b)).toEqual(expected)
      })
    }
  })

  describe('greaterThan', () => {
    const table = [
      { a: null, b: '', expected: false },
      { a: undefined, b: '', expected: false },
      { a: '', b: '', expected: false },
      { a: '0', b: '', expected: true },
      { a: 0, b: '', expected: false },
      { a: null, b: '0', expected: false },
      { a: undefined, b: '0', expected: false },
      { a: '0', b: '0', expected: false },
      { a: 0, b: '0', expected: false },
      { a: '1', b: '0', expected: true },
      { a: 1, b: '0', expected: true },
      { a: null, b: '1', expected: false },
      { a: undefined, b: '1', expected: false },
      { a: '0', b: '1', expected: false },
      { a: 0, b: '1', expected: false },
      { a: '2', b: '1', expected: true },
      { a: 2, b: '1', expected: true },
      { a: ['0'], b: '0', expected: false },
      { a: [0], b: '0', expected: false },
      { a: ['1'], b: '0', expected: true },
      { a: [1], b: '0', expected: true },
      { a: ['1'], b: '1', expected: false },
      { a: [1], b: '1', expected: false },
      { a: ['1', '1'], b: '1', expected: true },
      { a: [1, 1], b: '1', expected: true },
    ]
    for (const { a, b, expected } of table) {
      it(`should return ${expected} for ${JSON.stringify(a)} > ${JSON.stringify(b)}`, () => {
        expect(greaterThan(a, b)).toEqual(expected)
      })
    }
  })

  describe('isIn', () => {
    const table = [
      { a: null, b: '', expected: false },
      { a: undefined, b: '', expected: false },
      { a: '', b: '', expected: true },
      { a: '0', b: '', expected: false },
      { a: 0, b: '', expected: false },
      { a: 0, b: '0', expected: true },
      { a: true, b: 'true', expected: true },
      { a: 'foo', b: 'foobar', expected: true },
      { a: 'bar', b: 'foobar', expected: true },
      { a: 'baz', b: 'foobar', expected: false },
      { a: ['foo', 'bar', 'baz'], b: 'foobar', expected: false },
    ]
    for (const { a, b, expected } of table) {
      it(`should return ${expected} for ${JSON.stringify(a)} in ${JSON.stringify(b)}`, () => {
        expect(isIn(a, b)).toEqual(expected)
      })
    }
  })

  describe('contains', () => {
    const table = [
      { a: null, b: '', expected: false },
      { a: undefined, b: '', expected: false },
      { a: '', b: '', expected: true },
      { a: '0', b: '', expected: true },
      { a: 0, b: '', expected: true },
      { a: 0, b: '0', expected: true },
      { a: '0', b: '0', expected: true },
      { a: ['foo', 'bar', 'baz'], b: 'foo', expected: true },
      { a: ['foo', 'bar', 'baz'], b: 'bar', expected: true },
      { a: ['foo', 'bar', 'baz'], b: 'baz', expected: true },
      { a: ['foo', 'bar', 'baz'], b: 'foobar', expected: false },
    ]
    for (const { a, b, expected } of table) {
      it(`should return ${expected} for ${JSON.stringify(a)} contains ${JSON.stringify(b)}`, () => {
        expect(contains(a, b)).toEqual(expected)
      })
    }
  })

  describe('startsWith', () => {
    const table = [
      { a: null, b: '', expected: false },
      { a: undefined, b: '', expected: false },
      { a: '', b: '', expected: true },
      { a: '0', b: '', expected: true },
      { a: 0, b: '', expected: true },
      { a: 0, b: '0', expected: true },
      { a: '0', b: '0', expected: true },
      { a: 'foobar', b: 'foo', expected: true },
      { a: 'foobar', b: 'bar', expected: false },
      { a: ['foo', 'bar', 'baz'], b: 'f', expected: true },
      { a: ['foo', 'bar', 'baz'], b: 'ba', expected: true },
      { a: ['foo', 'bar', 'baz'], b: 'z', expected: false },
    ]
    for (const { a, b, expected } of table) {
      it(`should return ${expected} for ${JSON.stringify(a)} startsWith ${JSON.stringify(b)}`, () => {
        expect(startsWith(a, b)).toEqual(expected)
      })
    }
  })

  describe('endsWith', () => {
    const table = [
      { a: null, b: '', expected: false },
      { a: undefined, b: '', expected: false },
      { a: '', b: '', expected: true },
      { a: '0', b: '', expected: true },
      { a: 0, b: '', expected: true },
      { a: 0, b: '0', expected: true },
      { a: '0', b: '0', expected: true },
      { a: 'foobar', b: 'foo', expected: false },
      { a: 'foobar', b: 'bar', expected: true },
      { a: ['foo', 'bar', 'baz'], b: 'oo', expected: true },
      { a: ['foo', 'bar', 'baz'], b: 'ar', expected: true },
      { a: ['foo', 'bar', 'baz'], b: 'az', expected: true },
      { a: ['foo', 'bar', 'baz'], b: 'xyz', expected: false },
    ]
    for (const { a, b, expected } of table) {
      it(`should return ${expected} for ${JSON.stringify(a)} endsWith ${JSON.stringify(b)}`, () => {
        expect(endsWith(a, b)).toEqual(expected)
      })
    }
  })
})
