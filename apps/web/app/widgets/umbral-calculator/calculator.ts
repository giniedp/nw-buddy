import { EquipSlotId } from '@nw-data/common'
import { sum } from 'lodash'

export interface CollectionState {
  items: SlotState[]
  score: number
}

export interface SlotState {
  id: EquipSlotId
  name: string
  weight: number
  icon: string
  gearScore: number
  locked: boolean

  nextGS?: number
  nextToUpgrade?: boolean
  nextUpgradeCost?: number
  nextContribution?: number
  maxGS?: number
  maxUpgradeCost?: number
  maxContribution?: number

  isUpgradable?: boolean
  isMaxedOut?: boolean
}

export interface UpgradeStep {
  slotId: EquipSlotId
  slotIcon: string
  slotName: string
  slotScore: number
  slotBump: number

  averageScore: number
  averageBump: number

  costs: number
  costsTotal: number
  costsPerGS: number
}

export interface Umbralgsupgrades {
  level: number
  cost: number
}

export function updateItemCosts(
  items: SlotState[],
  {
    minLevel,
    maxLevel,
    upgrades,
  }: {
    minLevel: number
    maxLevel: number
    upgrades: Umbralgsupgrades[]
  },
): void {
  for (const item of items) {
    item.nextGS = item.gearScore + 1
    item.nextUpgradeCost = upgrades.find((it) => it.level === item.gearScore)?.cost || 0
    item.nextContribution = item.nextUpgradeCost > 0 ? item.weight / item.nextUpgradeCost : 0

    item.maxUpgradeCost = sum(upgrades.map((it) => (it.level >= item.gearScore ? it.cost : 0)))
    item.maxContribution = item.maxUpgradeCost > 0 ? item.weight / item.maxUpgradeCost : 0
    item.maxGS = upgrades[upgrades.length - 1]?.level + 1 || 0
  }

  for (const item of items) {
    item.isUpgradable = !(item.gearScore < minLevel || item.gearScore > maxLevel)
    if (item.locked) {
      item.nextToUpgrade = false
      item.isMaxedOut = item.gearScore > maxLevel
    } else if (item.isUpgradable) {
      item.nextToUpgrade = items.every((it) => it.locked || item.nextContribution >= it.nextContribution)
      item.isMaxedOut = item.gearScore > maxLevel
    } else {
      item.nextToUpgrade = false
      item.isMaxedOut = item.gearScore > maxLevel
    }
  }
}

export function calculateFinalGearScore(items: SlotState[]) {
  let score = 0
  for (const item of items) {
    score += item.weight * item.gearScore
  }
  return score
}

function copyState<T>(state: T): T {
  return JSON.parse(JSON.stringify(state))
}

export function calculateSteps(
  items: SlotState[],
  options: {
    minLevel: number
    maxLevel: number
    upgrades: Umbralgsupgrades[]
  },
) {
  items = copyState(items)
  updateItemCosts(items, options)
  let score = calculateFinalGearScore(items)

  const steps: CollectionState[] = []
  while (score <= options.maxLevel + 1) {
    steps.push({ items, score })

    items = copyState(items)
    const item = items.find((it) => it.nextToUpgrade)
    if (!item) {
      break
    }

    item.gearScore += 1
    updateItemCosts(items, options)
    score = calculateFinalGearScore(items)
  }

  let costsTotal = 0
  return steps
    .map((step): UpgradeStep => {
      const index = step.items.findIndex((it) => it.nextToUpgrade)
      const upgraded = copyState(step)
      const costsToUpgrade = step.items[index]?.nextUpgradeCost || 0
      costsTotal += costsToUpgrade

      const bump = 1
      if (index >= 0) {
        upgraded.items[index].gearScore += bump
        updateItemCosts(upgraded.items, options)
        upgraded.score = calculateFinalGearScore(upgraded.items)
      }

      const slot = upgraded.items[index]
      return {
        slotId: slot?.id,
        slotName: slot?.name,
        slotIcon: slot?.icon,
        slotScore: slot?.gearScore,
        slotBump: bump,

        averageScore: upgraded.score,
        averageBump: upgraded.score - step.score,
        costs: costsToUpgrade,
        costsTotal: costsTotal,
        costsPerGS: slot?.nextContribution ?? 0,
      }
    })
    .filter((it) => !!it?.slotId)
}

export function groupSteps(upgrades: UpgradeStep[]): UpgradeStep[] {
  const result: UpgradeStep[] = []
  let current: UpgradeStep = null
  for (const step of upgrades) {
    if (!current || current.slotId !== step.slotId) {
      current = copyState(step)
      result.push(current)
      continue
    }
    current.slotScore = step.slotScore
    current.slotBump += step.slotBump

    current.averageScore = step.averageScore
    current.averageBump += step.averageBump

    current.costs += step.costs
    current.costsTotal = step.costsTotal

    current.costsPerGS = current.averageBump / current.costs
  }
  return result
}
