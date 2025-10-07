import { computed } from '@angular/core'
import { patchState, signalMethod, signalStore, withComputed, withMethods, withState } from '@ngrx/signals'
import { EquipSlotId, gearScoreRelevantSlots } from '@nw-data/common'
import {
  calculateFinalGearScore,
  calculateSteps,
  groupSteps,
  SlotState,
  Umbralgsupgrades,
  updateItemCosts,
  UpgradeStep,
} from './calculator'

export interface UmbralCalculatorState {
  slots: SlotState[]
  bank: number
  upgradeCosts: Umbralgsupgrades[]
  grouped: boolean
}

export const UmbralCalculatorStore = signalStore(
  withState<UmbralCalculatorState>({
    upgradeCosts: [],
    grouped: true,
    bank: 0,
    slots: gearScoreRelevantSlots().map((it) => {
      return {
        id: it.id,
        icon: it.iconSlot,
        name: it.name,
        gearScore: 700,
        weight: it.weight,
      }
    }),
  }),
  withComputed(({ slots, upgradeCosts }) => {
    const minLevel = computed(() => Math.min(...upgradeCosts().map((it) => it.level)))
    const maxLevel = computed(() => Math.max(...upgradeCosts().map((it) => it.level)))

    return {
      minLevel,
      maxLevel,
      items: computed(() => {
        const items = slots()
        updateItemCosts(items, {
          maxLevel: maxLevel(),
          minLevel: minLevel(),
          upgrades: upgradeCosts(),
        })
        return items
      }),
      gearScore: computed(() => {
        return Math.floor(calculateFinalGearScore(slots()))
      }),
    }
  }),
  withComputed(({ slots, minLevel, maxLevel, upgradeCosts, bank }) => {
    const upgrades = computed(() => {
      const result = calculateSteps(slots(), {
        maxLevel: maxLevel(),
        minLevel: minLevel(),
        upgrades: upgradeCosts(),
      })
      if (!bank()) {
        return result
      }
      return result.filter((it) => it.costsTotal <= bank())
    })

    return {
      upgrades,
      upgradesGrouped: computed(() => groupSteps(upgrades())),
      totalCost: computed(() => {
        const list = upgrades()
        const last = list[list.length - 1]
        return last ? last.costsTotal : null
      }),
      finalGS: computed(() => {
        const steps = upgrades()
        if (steps?.length) {
          return Math.floor(steps[steps.length - 1].averageScore)
        }
        return null
      }),
    }
  }),
  withMethods((state) => {
    return {
      connectCosts: signalMethod((costs: Umbralgsupgrades[]) => {
        patchState(state, {
          upgradeCosts: costs,
        })
      }),
      setGrouped(grouped: boolean) {
        patchState(state, { grouped })
      },
      setBank(value: number) {
        patchState(state, { bank: value })
      },
      setGearScore(slotId: EquipSlotId, gearScore: number) {
        patchState(state, ({ slots }) => {
          return {
            slots: slots.map((it) => {
              if (it.id !== slotId) {
                return it
              }
              return {
                ...it,
                gearScore,
              }
            }),
          }
        })
      },
      applyUpgrades(targetGearScore: number) {
        const upgrades = state.upgrades().filter((it) => it.averageScore <= targetGearScore)
        patchState(state, ({ slots }) => {
          return {
            slots: slots.map((slot) => {
              const slotUpgrades = upgrades.filter((it) => it.slotId === slot.id)
              return {
                ...slot,
                gearScore: Math.max(slot.gearScore, ...slotUpgrades.map((it) => it.slotScore)),
              }
            }),
          }
        })
      },
      slotFinalGs(slot: EquipSlotId) {
        return Math.floor(getSlotFinalGearScore(slot, state.slots(), state.upgrades()))
      },
    }
  }),
)

function getSlotFinalGearScore(slot: EquipSlotId, slots: SlotState[], upgrades: UpgradeStep[]) {
  let result = slots.find((it) => it.id === slot)?.gearScore ?? 0
  for (const upgrade of upgrades) {
    if (upgrade.slotId === slot) {
      result = Math.max(result, upgrade.slotScore)
    }
  }
  return result
}
