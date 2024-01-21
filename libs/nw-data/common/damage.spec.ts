import { calculateDamage } from './damage'
import { DAMAGE_SAMPLES, descriveSample } from './damage-samples'

fdescribe('calculateDamage', () => {
  for (const test of DAMAGE_SAMPLES) {
    it(descriveSample(test.input), () => {
      const result = calculateDamage(test.input)
      expect(result).toEqual(test.output)
    })
  }

})
