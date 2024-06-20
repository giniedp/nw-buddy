import { solveAttributePlacingMods } from './attributes'

describe('attributes #solveAttributePlacingMods', () => {
  const table = [
    {
      name: 'highest con',
      mods: [10],
      data: [
        { key: 'str', input: 0, output: 0 },
        { key: 'dex', input: 0, output: 0 },
        { key: 'int', input: 0, output: 0 },
        { key: 'foc', input: 0, output: 0 },
        { key: 'con', input: 1, output: 10 },
      ] as const,
    },
    {
      name: 'highest foc',
      mods: [10],
      data: [
        { key: 'str', input: 0, output: 0 },
        { key: 'dex', input: 0, output: 0 },
        { key: 'int', input: 0, output: 0 },
        { key: 'foc', input: 1, output: 10 },
        { key: 'con', input: 0, output: 0 },
      ] as const,
    },
    {
      name: 'highest int',
      mods: [10],
      data: [
        { key: 'str', input: 0, output: 0 },
        { key: 'dex', input: 0, output: 0 },
        { key: 'int', input: 1, output: 10 },
        { key: 'foc', input: 0, output: 0 },
        { key: 'con', input: 0, output: 0 },
      ] as const,
    },
    {
      name: 'highest dex',
      mods: [10],
      data: [
        { key: 'str', input: 0, output: 0 },
        { key: 'dex', input: 1, output: 10 },
        { key: 'int', input: 0, output: 0 },
        { key: 'foc', input: 0, output: 0 },
        { key: 'con', input: 0, output: 0 },
      ] as const,
    },
    {
      name: 'highest str',
      mods: [10],
      data: [
        { key: 'str', input: 1, output: 10 },
        { key: 'dex', input: 0, output: 0 },
        { key: 'int', input: 0, output: 0 },
        { key: 'foc', input: 0, output: 0 },
        { key: 'con', input: 0, output: 0 },
      ] as const,
    },
    {
      name: 'highest con,foc',
      mods: [10],
      data: [
        { key: 'str', input: 0, output: 0 },
        { key: 'dex', input: 0, output: 0 },
        { key: 'int', input: 0, output: 0 },
        { key: 'foc', input: 1, output: 5 },
        { key: 'con', input: 1, output: 5 },
      ] as const,
    },
    {
      name: 'highest con,foc,int',
      mods: [10],
      data: [
        { key: 'str', input: 0, output: 0 },
        { key: 'dex', input: 0, output: 0 },
        { key: 'int', input: 1, output: 3 },
        { key: 'foc', input: 1, output: 3 },
        { key: 'con', input: 1, output: 3 },
      ] as const,
    },
    {
      name: 'highest con,foc,int,dex',
      mods: [10],
      data: [
        { key: 'str', input: 0, output: 0 },
        { key: 'dex', input: 1, output: 2 },
        { key: 'int', input: 1, output: 2 },
        { key: 'foc', input: 1, output: 2 },
        { key: 'con', input: 1, output: 2 },
      ] as const,
    },
    {
      name: 'highest con,foc,int,dex,str',
      mods: [10],
      data: [
        { key: 'str', input: 1, output: 2 },
        { key: 'dex', input: 1, output: 2 },
        { key: 'int', input: 1, output: 2 },
        { key: 'foc', input: 1, output: 2 },
        { key: 'con', input: 1, output: 2 },
      ] as const,
    },
    {
      name: 'three split',
      mods: [50, 10, 10, 10, 10],
      data: [
        { key: 'str', input: 1, output: 3 },
        { key: 'dex', input: 1, output: 3 },
        { key: 'int', input: 1, output: 3 }, // TODO: output ingame is 4
        { key: 'foc', input: 2, output: 10 },
        { key: 'con', input: 3, output: 50 },
      ] as const,
    },
    {
      name: 'four split',
      mods: [50, 10, 10, 10, 10],
      data: [
        { key: 'str', input: 1, output: 2 },
        { key: 'dex', input: 1, output: 2 },
        { key: 'int', input: 1, output: 2 },
        { key: 'foc', input: 1, output: 2 }, // TODO: output ingame is 4
        { key: 'con', input: 3, output: 50 },
      ] as const,
    },
  ]
  table.forEach(({ name, mods, data }, i) => {
    it(`${name} ${mods}`, () => {
      expect(
        solveAttributePlacingMods({
          placingMods: mods,
          stats: data.map((it) => ({
            key: it.key,
            value: it.input,
          })),
          placement: null
        })
      ).toEqual(
        data.map((it) => ({
          key: it.key,
          value: it.output,
        }))
      )
    })
  })
})
