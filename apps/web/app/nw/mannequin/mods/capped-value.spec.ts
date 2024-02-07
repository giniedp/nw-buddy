import { cappedValue } from './capped-value'

describe('CappedValue', () => {
  it('sums', () => {
    const value = cappedValue()
    value.add(1)
    expect(value.total).toEqual(1)
    value.add(2)
    expect(value.total).toEqual(3)
    value.add(-1)
    expect(value.total).toEqual(2)
    value.add(2, 2.5)
    expect(value.total).toEqual(2.5)
    expect(value.overflow).toEqual(1.5)
    value.add(2, 5)
    expect(value.total).toEqual(4.5)
    expect(value.overflow).toEqual(1.5)
    value.add(2, 5)
    expect(value.total).toEqual(5)
    expect(value.overflow).toEqual(3)

    //
    value.add(-2, -5)
    expect(value.total).toEqual(5)
    expect(value.overflow).toEqual(1)
    value.add(-2, -5)
    expect(value.total).toEqual(4)
    expect(value.overflow).toEqual(0)
    value.add(-4, -1.5)
    expect(value.total).toEqual(0)
    expect(value.overflow).toEqual(0)

    value.add(8)
    expect(value.total).toEqual(8)
    expect(value.overflow).toEqual(0)

    value.add(1, 0.5)
    expect(value.total).toEqual(8)
    expect(value.overflow).toEqual(1)
  })
})
