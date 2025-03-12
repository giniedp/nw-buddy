import { selectLayout } from './virtual-grid.store'

describe('VirtualGridStore', () => {
  describe('selectLayout', () => {
    const table: Array<{
      input: Parameters<typeof selectLayout>[0]
      output: ReturnType<typeof selectLayout>
    }> = [
      {
        input: { size: 100, itemWidth: null, colCount: null },
        output: { size: 100, cols: 1 },
      },
      {
        input: { size: 100, itemWidth: null, colCount: 1 },
        output: { size: 100, cols: 1 },
      },
      {
        input: { size: 100, itemWidth: null, colCount: 10 },
        output: { size: 100, cols: 10 },
      },
      {
        input: { size: 100, itemWidth: null, colCount: 10 },
        output: { size: 100, cols: 10 },
      },
      {
        input: { size: 100, itemWidth: null, colCount: 20 },
        output: { size: 100, cols: 20 },
      },

      {
        input: { size: 100, itemWidth: 10, colCount: 5 },
        output: { size: 100, cols: 10 },
      },

      {
        input: { size: 100, itemWidth: 10, colCount: 10 },
        output: { size: 100, cols: 10 },
      },
      {
        input: { size: 100, itemWidth: 10, colCount: 20 },
        output: { size: 100, cols: 10 },
      },
      {
        input: { size: 100, itemWidth: 20, colCount: 20 },
        output: { size: 100, cols: 5 },
      },

      {
        input: { size: 100, itemWidth: [10, 20], colCount: null },
        output: { size: 100, cols: 10 },
      },
      {
        input: { size: 100, itemWidth: [15, 15], colCount: null },
        output: { size: 90, cols: 6 },
      },
      {
        input: { size: 100, itemWidth: [15, 15], colCount: [1, 5] },
        output: { size: 75, cols: 5 },
      },
    ]

    for (const spec of table) {
      it(`${JSON.stringify(spec.input)} => ${JSON.stringify(spec.output)}`, () => {
        expect(selectLayout(spec.input)).toEqual(spec.output)
      })
    }
  })
})
