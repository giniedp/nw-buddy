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
    description: 'ui_strength_tooltip'
  },
  {
    ref: 'dex',
    type: 'Dexterity',
    displayName: 'ui_dexterity',
    shortName: 'ui_dexterity_short',
    description: 'ui_dexterity_tooltip'
  },
  {
    ref: 'int',
    type: 'Intelligence',
    displayName: 'ui_intelligence',
    shortName: 'ui_intelligence_short',
    description: 'ui_intelligence_tooltip'
  },
  {
    ref: 'foc',
    type: 'Focus',
    displayName: 'ui_focus',
    shortName: 'ui_focus_short',
    description: 'ui_focus_tooltip'
  },
  {
    ref: 'con',
    type: 'Constitution',
    displayName: 'ui_constitution',
    shortName: 'ui_constitution_short',
    description: 'ui_constitution_tooltip'
  },
]
