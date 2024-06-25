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

export const GatherablesSchema = z.object({
  GatherableID: z.string(),
})
export const GatherablesTableSchema = z.array(GatherablesSchema)

export const VariationsSchema = z.object({
  VariantID: z.string(),
})
export const VariationsTableSchema = z.array(VariationsSchema)

export const ExpansionDataSchema = z.object({
  ExpansionId: z.string(),
  MaxCraftGS: z.number(),
  MaxEquipGS: z.number(),
  MaxDisplayLevel: z.number(),
  MaxTradeskillLevel: z.number(),
})
export const ExpansionTableSchema = z.array(ExpansionDataSchema)
export const ExpansionFileSchema = z.object({ rows: ExpansionTableSchema })

export const EncumbranceDataSchema = z.object({
  ContainerTypeID: z.string(),
  EquipLoadRatioFast: z.number(),
  EquipLoadRatioNormal: z.number(),
  EquipLoadRatioSlow: z.number(),
  EquipLoadDamageMultFast: z.number(),
  EquipLoadDamageMultNormal: z.number(),
  EquipLoadDamageMultSlow: z.number(),
  EquipLoadDamageOverburdened: z.number(),
  EquipLoadHealMultFast: z.number(),
  EquipLoadHealMultNormal: z.number(),
  EquipLoadHealMultSlow: z.number(),
})
export const EncumbranceTableSchema = z.array(EncumbranceDataSchema)
export const EncumbranceFileSchema = z.object({ rows: EncumbranceTableSchema })

export const MasterItemDefinitionsSchema = z.object({
  ItemID: z.string(),
  ArmorAppearanceM: z.optional(z.string()),
  ArmorAppearanceF: z.optional(z.string()),
  WeaponAppearanceOverride: z.optional(z.string()),
  ItemType: z.string(),
})
export const MasterItemTableSchema = z.array(MasterItemDefinitionsSchema)
export const MasterItemFileSchema = z.object({ rows: MasterItemTableSchema })
export type MasterItemFile = z.infer<typeof MasterItemFileSchema>
