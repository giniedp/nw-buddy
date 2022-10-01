import { firstValueFrom, of } from "rxjs"
import { NwExpSolveFn, parseNwExpression } from "./expressions"

async function testExpression(input: string, expected: string, fn: NwExpSolveFn = () => of('0')) {
  const epxr = parseNwExpression(input)
  const result = await firstValueFrom(epxr.eval(fn))
  expect(result).toEqual(expected)
}

describe('expression', () => {
  // const text = "Once every <font face=\"lyshineui/fonts/Nimbus_SemiBold.font\" color=\"#ffd45f\">{[Type_StatusEffectData.Blunderbuss_ChargeCooldownOnCooldown.BaseDuration]}s</font>, your next ability used will have its cooldown reduced by <font face=\"lyshineui/fonts/Nimbus_SemiBold.font\" color=\"#ffd45f\">{[BlunderbussAbilityTable.Blunderbuss_Charge.CooldownTimer * -100]}%</font>."
  it('parses expression', async () => {
    await testExpression('Foo {[bar]} Baz', 'Foo 0 Baz')
    await testExpression('Foo {[bar + 100]} Baz', 'Foo 101 Baz', () => of(1))
    await testExpression('Foo {[bar+100]} Baz', 'Foo 101 Baz', () => of(1))
    await testExpression('Foo {[bar * 200]} Baz', 'Foo 200 Baz', () => of(1))
    await testExpression('Foo {[bar*200]} Baz', 'Foo 200 Baz', () => of(1))
    await testExpression('Foo {[bar - 300]} Baz', 'Foo -299 Baz', () => of(1))
    await testExpression('Foo {[bar-300]} Baz', 'Foo -299 Baz', () => of(1))
  })
})
