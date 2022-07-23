import { Umbralgsupgrades } from "@nw-data/types"

// const BASE = [
//   { id: 'head', icon: 'assets/icons/slots/lightheada.png', name: 'ui_itemtypedescription_head_slot', weight: 0.07 },
//   { id: 'chest', icon: 'assets/icons/slots/lightchesta.png', name: 'ui_itemtypedescription_chest_slot', weight: 0.12 },
//   { id: 'hands', icon: 'assets/icons/slots/lighthandsa.png', name: 'ui_itemtypedescription_hands_slot', weight: 0.05 },
//   { id: 'legs', icon: 'assets/icons/slots/lightlegsa.png', name: 'ui_itemtypedescription_legs_slot', weight: 0.07 },
//   { id: 'feet', icon: 'assets/icons/slots/lightfeeta.png', name: 'ui_itemtypedescription_feet_slot', weight: 0.035 },
//   { id: 'weapon1', icon: 'assets/icons/slots/weapon.png', name: 'ui_weapon1', weight: 0.225 },
//   { id: 'weapon2', icon: 'assets/icons/slots/weapon.png', name: 'ui_weapon2', weight: 0.225 },
//   { id: 'amulet', icon: 'assets/icons/slots/trinketp.png', name: 'ui_amulet_slot_tooltip', weight: 0.065 },
//   { id: 'ring', icon: 'assets/icons/slots/trinketa.png', name: 'ui_ring_slot_tooltip', weight: 0.065 },
//   { id: 'earring', icon: 'assets/icons/slots/trinkete.png', name: 'ui_unlock_token_slot', weight: 0.065 },
// ]

const BASE = [
  { id: 'head', icon: 'assets/icons/slots/lightheada.png', name: 'ui_itemtypedescription_head_slot', weight: 42 },
  { id: 'chest', icon: 'assets/icons/slots/lightchesta.png', name: 'ui_itemtypedescription_chest_slot', weight: 73 },
  { id: 'hands', icon: 'assets/icons/slots/lighthandsa.png', name: 'ui_itemtypedescription_hands_slot', weight: 31 },
  { id: 'legs', icon: 'assets/icons/slots/lightlegsa.png', name: 'ui_itemtypedescription_legs_slot', weight: 42 },
  { id: 'feet', icon: 'assets/icons/slots/lightfeeta.png', name: 'ui_itemtypedescription_feet_slot', weight: 21 },
  { id: 'weapon1', icon: 'assets/icons/slots/weapon.png', name: 'ui_weapon1', weight: 135 },
  { id: 'weapon2', icon: 'assets/icons/slots/weapon.png', name: 'ui_weapon2', weight: 135 },
  { id: 'amulet', icon: 'assets/icons/slots/trinketp.png', name: 'ui_amulet_slot_tooltip', weight: 40 },
  { id: 'ring', icon: 'assets/icons/slots/trinketa.png', name: 'ui_ring_slot_tooltip', weight: 40 },
  { id: 'earring', icon: 'assets/icons/slots/trinkete.png', name: 'ui_unlock_token_slot', weight: 40 },
]

export interface CollectionState {
  items: ItemState[]
  score: number
}

export interface ItemState {
  id: string
  name: string
  weight: number
  icon: string
  score?: number
  shards?: number
  contribution?: number
  upgrade?: boolean
}

export interface UpgradeStep {
  state: CollectionState
  item: ItemState
  score: number
  scoreDelta: number
  shards: number
  shardsTotal: number
}

export function createState(): CollectionState {
  const total = BASE.reduce((res, it) => res + it.weight, 0)
  console.log(total)
  return {
    items: BASE.map((it) => {
      return {
        value: 0,
        shards: 0,
        contribution: 0,
        next: false,
        ...it,
        weight: it.weight / total
      }
    }),
    score: 0
  }
}

export function updateState(state: CollectionState, upgrades: Umbralgsupgrades[]) {
  let score = 0
  for (const item of state.items) {
    item.shards = upgrades.find((it) => it.Level === item.score)?.RequiredItemQuantity || 0
    item.contribution = item.shards > 0 ? item.weight / item.shards : 0
    score += item.weight * item.score
  }

  const minLevel = Math.min(...upgrades.map((it) => it.Level))
  const maxLevel = Math.max(...upgrades.map((it) => it.Level))
  for (const item of state.items) {
    if (item.score < minLevel || item.score > maxLevel) {
      item.upgrade = false
    } else {
      item.upgrade = state.items.every((it) => item.contribution >= it.contribution)
    }
  }
  state.score = score
  return state
}

function copyState(state: CollectionState): CollectionState {
  return JSON.parse(JSON.stringify(state))
}

export function calculateSteps(state: CollectionState, upgrades: Umbralgsupgrades[]) {
  state = updateState(copyState(state), upgrades)
  const steps: CollectionState[] = []
  const maxLevel = Math.max(...upgrades.map((it) => it.Level))
  while (state.score <= (maxLevel + 1)) {
    steps.push(state)

    state = copyState(state)
    const item = state.items.find((it) => it.upgrade)
    if (!item) {
      break
    }
    item.score += 1
    updateState(state, upgrades)
  }

  let shardsTotal = 0
  return steps.map((step): UpgradeStep => {
    const index = step.items.findIndex((it) => it.upgrade)
    const upgraded = copyState(step)
    let shards = 0
    if (index >= 0) {
      upgraded.items[index].score += 1
      updateState(upgraded, upgrades)
      shards = step.items[index].shards
      shardsTotal += shards
    }

    return {
      state: upgraded,
      item: upgraded.items[index],
      score: upgraded.score,
      scoreDelta: upgraded.score - step.score,
      shards: shards,
      shardsTotal: shardsTotal
    }
  })
  .filter((it) => !!it.item)
}
