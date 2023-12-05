import { diceCoefficient } from 'dice-coefficient'
import MatchersUtil = jasmine.MatchersUtil
import CustomMatcher = jasmine.CustomMatcher
import CustomMatcherResult = jasmine.CustomMatcherResult
import Constructor = jasmine.Constructor

declare global {
  namespace jasmine {
    interface Matchers<T> {
      toLooselyMatch(expected: string): boolean
    }
  }
}

export let customMatchers = {
  toLooselyMatch: function (util: MatchersUtil): CustomMatcher {
    return {
      compare: function (actual: string, expected: string): CustomMatcherResult {
        const coef = diceCoefficient(actual || '', expected || '')
        if (coef > 0.9) {
          return {
            pass: true,
            message: `${actual} matches ${expected} (dice coefficient: ${coef})`,
          }
        } else {
          return {
            pass: false,
            message: `Expected ${actual} to match ${expected} (dice coefficient: ${coef})`,
          }
        }
      },
    }
  },
}
