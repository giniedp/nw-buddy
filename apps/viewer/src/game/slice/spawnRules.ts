import {
  isViewerAreaSpawnerComponent,
  type ViewerAreaSpawnerComponent,
  type ViewerPointSpawnerComponent,
  type ViewerPrefabSpawnerComponent,
  type ViewerSlice,
} from '../../api'
import type { DayPhase } from '../level/TimeOfDay'

/**
 * The spawner component that spawns a slice
 */
export type SpawnRuleSource = ViewerPrefabSpawnerComponent | ViewerPointSpawnerComponent | ViewerAreaSpawnerComponent

/**
 * A slice about to spawn: a spawned slice, or a slice the level places (capital, chunk). Previews of the browser
 * show any slice and skip the rules.
 */
export interface SpawnRuleInput {
  /**
   * The spawner component of the slice, null for a slice the level places
   */
  source: SpawnRuleSource | null
  /**
   * The slice that holds the spawner, null for a slice the level places
   */
  parent: ViewerSlice | null
  /**
   * The slice the spawner spawns
   */
  target: ViewerSlice
  /**
   * The phase of the day when the slice spawns, null without a sky (e.g. a preview)
   */
  phase: DayPhase | null
}

/**
 * Decides whether the viewer leaves a spawned slice out. The viewer has no game logic (quests, events, triggers), so
 * the rules leave out what the game spawns by such logic.
 */
export interface SpawnRule {
  /**
   * Names the rule in the spawn stats (SliceSystem.ruleSkips)
   */
  name: string
  /**
   * True: the viewer does not spawn the target slice
   */
  skip(input: SpawnRuleInput): boolean
}

/**
 * A category of encounters by their name, the name of the entity with the EncounterManagerComponent
 */
export interface EncounterCategory {
  name: string
  /**
   * Matches the encounter name, case insensitive
   */
  pattern: RegExp
  /**
   * True: the viewer does not spawn encounters of this category from area spawners
   */
  skip: boolean
}

/**
 * The encounter categories in order, the first match counts (as nwbt's ParseEncounterName). Names without a match are
 * {@link OTHER_ENCOUNTERS}.
 */
export const ENCOUNTER_CATEGORIES: readonly EncounterCategory[] = [
  // e.g. RandomEncounter_…
  { name: 'random', pattern: /randomencounter/i, skip: true },
  // e.g. Enc_Darkness_Major_Monolith_00
  { name: 'darkness', pattern: /enc_darkness|darknesshunt/i, skip: true },
  // e.g. Enc_WorldEvent_LootGoblin_00, encounter_rafflebones_portal
  { name: 'goblin', pattern: /lootgoblin|rafflebones/i, skip: false },
  // e.g. Siege_Fort_Brightwood
  { name: 'siege', pattern: /siege_fort_/i, skip: true },
  // e.g. worldevent_enc_worldboss_admiralbrute
  { name: 'worldboss', pattern: /worldboss/i, skip: true },
  // e.g. enc_summermedley_activity_maudlinbugwaltz_00
  { name: 'summermedley', pattern: /summermedley/i, skip: true },
  // e.g. enc_springtide_activity_wispybloom_01
  { name: 'springtide', pattern: /springtide/i, skip: true },
  // e.g. enc_worldevent_mimic_statue_corrupted_acolyte
  { name: 'worldevent', pattern: /worldevent/i, skip: true },
  // e.g. enc_sandworm_glimpseevent_00
  { name: 'sandworm', pattern: /sandworm/i, skip: false },
  // e.g. enc_fl_hunt_the_hunter_turkeytodrake
  { name: 'hunt_the_hunter', pattern: /hunt_the_hunter/i, skip: false },
  // e.g. dg_enc_cutlasskeys_00_dryadsiren
  { name: 'dungeon', pattern: /^dg_/i, skip: false },
  // e.g. raid_enc_cutlasskeys_00_ch01_clearing
  { name: 'raid', pattern: /^raid_/i, skip: false },
  // e.g. enc_trial_hatchery_soloplus
  { name: 'trial', pattern: /trial_/i, skip: false },
  // e.g. Enc_FirstLight_01_Mammoth_Open_World_Encounter_Daily
  { name: 'daily', pattern: /_daily/i, skip: false },
  // e.g. enc_quest_apophis
  { name: 'quest', pattern: /_quest/i, skip: false },
  // e.g. enc_dw_gimmick_castleoutdoor_rotatingbookcase_02
  { name: 'gimmick', pattern: /_gimmick|gimmick_/i, skip: false },
  // e.g. enc_catacombs_extraction
  { name: 'catacombs', pattern: /_catacombs/i, skip: false },
  // e.g. enc_arena_pirate_00
  { name: 'arena', pattern: /_arena/i, skip: false },
]

/**
 * The category of encounters that match none of {@link ENCOUNTER_CATEGORIES}
 */
export const OTHER_ENCOUNTERS: EncounterCategory = { name: 'other', pattern: /.*/, skip: true }

/**
 * The category of an encounter by its name
 */
export function encounterCategory(name: string): EncounterCategory {
  return ENCOUNTER_CATEGORIES.find((it) => it.pattern.test(name)) ?? OTHER_ENCOUNTERS
}

/**
 * The rules in order, the first one that skips a slice counts it
 */
export const SPAWN_RULES: readonly SpawnRule[] = [
  {
    // Quest and mission NPCs: the slice has an NpcComponent, spawned or placed by the level. Which of them stand where
    // depends on the quest state of the player (e.g. the masternpc_swap_defaulthidden / defaultshown swaps), which the
    // viewer does not have.
    name: 'npc',
    skip: (it) => !!it.target.npc,
  },
  {
    // Spawned by a creature event: a spawner inside a creature (VitalsComponent) that does not spawn when it
    // initializes (m_spawnOnInitialize, or the point spawner's m_autoSpawnEnabled, is false). E.g. the loot bag a
    // creature drops on death. Limited to creatures: server systems trigger spawners elsewhere that the game always
    // shows (fort gates, capture points, settlement crafting stations).
    name: 'creature-trigger-only',
    skip: (it) => !!it.source?.triggerOnly && !!it.parent?.creature,
  },
  {
    // Scripted events: an area spawner that spawns an encounter (EncounterManagerComponent on the spawned slice),
    // e.g. the world event, world boss and random encounter spawn groups. The encounter runs waves of creatures.
    // Limited to area spawners: prefab and point spawners spawn encounter slices that are
    // props (levers, gates), and settlements and forts are encounters with their set dressing inside.
    // Which encounters are left out is decided by their category, see ENCOUNTER_CATEGORIES.
    name: 'area-encounter',
    skip: (it) => {
      if (!it.source || !isViewerAreaSpawnerComponent(it.source) || !it.target.encounter) {
        return false
      }
      const category = encounterCategory(it.target.encounter)
      if (category.skip) {
        console.log('SKIPPING', category)
        return true
      }
      return false
    },
  },
  {
    // Time of day: the spawner has a TimeOfDayConstraintComponent and the current phase is not one of its phases.
    // Day and night spawns often stand in pairs at the same spot, showing both doubles them.
    // Checked once when the slice spawns: nothing despawns when the clock moves on.
    name: 'time-of-day',
    skip: (it) => !!it.phase && !!it.source?.timeOfDay && !it.source.timeOfDay[it.phase],
  },
]

/**
 * Finds the first rule that leaves the slice out, null if it spawns
 */
export function findSkippingRule(input: SpawnRuleInput): SpawnRule | null {
  for (const rule of SPAWN_RULES) {
    if (rule.skip(input)) {
      return rule
    }
  }
  return null
}
