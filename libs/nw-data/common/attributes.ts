export type AttributeRef = 'str' | 'dex' | 'int' | 'foc' | 'con'
export interface AttributeType {
  ref: AttributeRef
  type: string
  displayName: string
  shortName: string
  description: string
}

export const NW_ATTRIBUTE_TYPES: AttributeType[] = [
  {
    ref: 'str',
    type: 'Strength',
    displayName: 'ui_strength',
    shortName: 'ui_strength_short',
    description: 'ui_strength_tooltip',
  },
  {
    ref: 'dex',
    type: 'Dexterity',
    displayName: 'ui_dexterity',
    shortName: 'ui_dexterity_short',
    description: 'ui_dexterity_tooltip',
  },
  {
    ref: 'int',
    type: 'Intelligence',
    displayName: 'ui_intelligence',
    shortName: 'ui_intelligence_short',
    description: 'ui_intelligence_tooltip',
  },
  {
    ref: 'foc',
    type: 'Focus',
    displayName: 'ui_focus',
    shortName: 'ui_focus_short',
    description: 'ui_focus_tooltip',
  },
  {
    ref: 'con',
    type: 'Constitution',
    displayName: 'ui_constitution',
    shortName: 'ui_constitution_short',
    description: 'ui_constitution_tooltip',
  },
]

export function solveAttributePlacingMods({
  stats,
  placingMods,
  placement
}: {
  stats: Array<{ key: AttributeRef; value: number }>
  placingMods: number[]
  placement: AttributeRef
}): Array<{ key: AttributeRef; value: number }> {
  const result = stats.map((it) => {
    return { key: it.key, value: 0 }
  })
  // when stats are equal, this sort order applies
  const evaluateOrder: AttributeRef[] = ['con', 'foc', 'str', 'dex', 'int']
  stats = [...stats].sort((a, b) => {
    if (b.value === a.value) {
      return evaluateOrder.indexOf(a.key) - evaluateOrder.indexOf(b.key)
    }
    return b.value - a.value
  })

  if (!placement) {
    placingMods.forEach((value, index) => {
      // index == 0 then highest stat is magnified
      // index == 1 then second highest stat is magnified
      // index == 2 etc...
      const stat = stats[index]
      const candidates = stats.filter((it) => it.value === stat.value)
      const boost = value / candidates.length
      candidates.forEach((it) => {
        const slot = result.find((slot) => slot.key === it.key)
        if (boost > slot.value) {
          slot.value = Math.floor(boost)
        }
      })
    })
  } else {
    for (const value of placingMods) {
      const slot = result.find((slot) => slot.key === placement)
      slot.value += value
    }
  }

  return result
}
