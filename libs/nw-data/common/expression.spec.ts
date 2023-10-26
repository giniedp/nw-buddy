/// <reference types="@types/jasmine" />

import { firstValueFrom, of } from 'rxjs'
import { NwExpSolveFn, parseNwExpression } from './expressions'

async function testExpression(input: string, expected: string, context: Record<string, number>) {
  const epxr = parseNwExpression(input)
  const result = await firstValueFrom(
    epxr.eval((key) => {
      return of(context[key])
    })
  )
  expect(result).toEqual(expected)
}

describe('expression', () => {
  const context = {
    foo: 0,
    bar: 1,
    baz: 2,
    seconds: 180
  }
  const table = [
    { input: 'Foo {[foo]} Baz', expected: 'Foo 0 Baz' },
    { input: 'Foo {[bar + 100]} Baz', expected: 'Foo 101 Baz' },
    { input: 'Foo {[bar+100]} Baz', expected: 'Foo 101 Baz' },
    { input: 'Foo {[bar * 200]} Baz', expected: 'Foo 200 Baz' },
    { input: 'Foo {[bar*200]} Baz', expected: 'Foo 200 Baz' },
    { input: 'Foo {[bar - 300]} Baz', expected: 'Foo -299 Baz' },
    { input: 'Foo {[bar-300]} Baz', expected: 'Foo -299 Baz' },
    { input: 'Foo {[{[bar-300]}]} Baz', expected: 'Foo -299 Baz' },
    { input: '{foo} {bar} {baz}', expected: '0 1 2' },
    { input: '{ foo } { bar } { baz }', expected: '0 1 2' },
    { input: '{foo} {[1 + {bar}]} {baz}', expected: '0 2 2' },
    { input: '1 + {foo} + 2 + {baz}', expected: '1 + 0 + 2 + 2' },
    { input: '1+{foo}+2+{baz}', expected: '1+0+2+2' },
    { input: '{[(seconds)/60]}', expected: '3'}
  ]
  table.forEach(({ input, expected }) => {
    it(`parses expression ${input}`, async () => {
      await testExpression(input, expected, context)
    })
  })

  // const text = "Once every <font face=\"lyshineui/fonts/Nimbus_SemiBold.font\" color=\"#ffd45f\">{[Type_StatusEffectData.Blunderbuss_ChargeCooldownOnCooldown.BaseDuration]}s</font>, your next ability used will have its cooldown reduced by <font face=\"lyshineui/fonts/Nimbus_SemiBold.font\" color=\"#ffd45f\">{[BlunderbussAbilityTable.Blunderbuss_Charge.CooldownTimer * -100]}%</font>."
})
