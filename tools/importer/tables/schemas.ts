import { z } from 'zod'

export const VitalsSchema = z.object({
  VitalsID: z.string(),
  LootTags: z.optional(z.string()),
})
export const VitalsTableSchema = z.array(VitalsSchema)

export const VitalsCategoriesSchema = z.object({
  VitalsCategoryID: z.string(),
})
export const VitalsCategoriesTableSchema = z.array(VitalsCategoriesSchema)

export const TerritoriesSchema = z.object({
  LootTags: z.optional(z.string()),
})
export const TerritoriesTableSchema = z.array(TerritoriesSchema)

export const POIDefinitionSchema = z.object({
  LootTags: z.optional(z.string()),
})
export const POIDefinitionTableSchema = z.array(POIDefinitionSchema)

export const GameModesSchema = z.object({
  LootTags: z.optional(z.string()),
  MutLootTagsOverride: z.optional(z.string()),
})
export const GameModesTableSchema = z.array(GameModesSchema)
