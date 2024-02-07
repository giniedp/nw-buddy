import { DamageType } from "../generated/types"

const DAMAGE_TYPES: Array<{
  TypeID: DamageType
  DisplayName: string
  Category: string
}> = [
  {
    TypeID: 'True',
    DisplayName: 'True_DamageName',
    Category: 'True',
  },
  {
    TypeID: 'Falling',
    DisplayName: 'Falling_DamageName',
    Category: 'True',
  },
  {
    TypeID: 'Standard',
    DisplayName: 'Standard_DamageName',
    Category: 'Physical',
  },
  {
    TypeID: 'Slash',
    DisplayName: 'Slash_DamageName',
    Category: 'Physical',
  },
  {
    TypeID: 'Thrust',
    DisplayName: 'Thrust_DamageName',
    Category: 'Physical',
  },
  {
    TypeID: 'Strike',
    DisplayName: 'Strike_DamageName',
    Category: 'Physical',
  },
  {
    TypeID: 'PhysFire',
    DisplayName: 'PhysFire_DamageName',
    Category: 'Physical',
  },
  {
    TypeID: 'Arcane',
    DisplayName: 'Arcane_DamageName',
    Category: 'Elemental',
  },
  {
    TypeID: 'Fire',
    DisplayName: 'Fire_DamageName',
    Category: 'Elemental',
  },
  {
    TypeID: 'Lightning',
    DisplayName: 'Lightning_DamageName',
    Category: 'Elemental',
  },
  {
    TypeID: 'Corruption',
    DisplayName: 'Corruption_DamageName',
    Category: 'Elemental',
  },
  {
    TypeID: 'Siege',
    DisplayName: 'Siege_DamageName',
    Category: 'Physical',
  },
  {
    TypeID: 'Ice',
    DisplayName: 'Ice_DamageName',
    Category: 'Elemental',
  },
  {
    TypeID: 'Nature',
    DisplayName: 'Nature_DamageName',
    Category: 'Elemental',
  },
  {
    TypeID: 'Acid',
    DisplayName: 'Acid_DamageName',
    Category: 'True',
  },
  {
    TypeID: 'Brimstone',
    DisplayName: 'True_DamageName',
    Category: 'True',
  },
]

export function getDamageTypes() {
  return DAMAGE_TYPES.map((it) => it.TypeID)
}

export function getDamageTypesOfCategory(category: string) {
  return DAMAGE_TYPES.filter((it) => eqCaseInsensitive(category, it.Category)).map((it) => it.TypeID)
}

export function isDamageTypeOfCategory(type: string, category: string) {
  for (const damage of DAMAGE_TYPES) {
    if (eqCaseInsensitive(damage.TypeID, type) && eqCaseInsensitive(damage.Category, category)) {
      return true
    }
  }
  return false
}

export function isDamageTypeElemental(type: string) {
  return isDamageTypeOfCategory(type, 'Elemental')
}

export function isDamageTypePhysical(type: string) {
  return isDamageTypeOfCategory(type, 'Physical')
}

function eqCaseInsensitive(a: string, b: string) {
  return a?.toLowerCase() === b?.toLowerCase()
}
