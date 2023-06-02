import { gearScoreRelevantSlots } from '@nw-data/common'
import { Umbralgsupgrades } from '@nw-data/generated'

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
  const slots = gearScoreRelevantSlots()
  const result: CollectionState = {
    items: slots.map((it) => {
      return {
        id: it.id,
        icon: it.iconSlot,
        name: it.name,
        value: 0,
        shards: 0,
        contribution: 0,
        next: false,
        weight: it.weight,
      }
    }),
    score: 0,
  }
  return result
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
  while (state.score <= maxLevel + 1) {
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
  return steps
    .map((step): UpgradeStep => {
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
        shardsTotal: shardsTotal,
      }
    })
    .filter((it) => !!it.item)
}
