import path from 'node:path'
import { z } from 'zod'
import {
  isAreaStatusEffectComponent,
  isAreaStatusEffectComponentServerFacet,
} from '../file-formats/slices/types/dynamicslice'
import { readDynamicSliceFile, resolveDynamicSliceFile } from '../file-formats/slices/utils'
import { glob, readJSONFile } from '../utils/file-utils'
import { withProgressBar } from '../utils/progress'

const SPELL_SCHEMA = z.object({
  rows: z.array(
    z.object({
      SpellPrefabPath: z.string().optional(),
    }),
  ),
})

export async function processSpells({ inputDir }: { inputDir: string }) {
  const slicesDir = path.join(inputDir, 'slices')
  const tablesDir = path.join(inputDir, 'sharedassets', 'springboardentitites', 'datatables')
  const spellFiles = await glob(path.join(tablesDir, 'javelindata_spelltable_*.json'))

  const meta = new Map<
    string,
    {
      statusEffects: string[]
    }
  >()

  await withProgressBar({ label: 'Processing Spells', tasks: spellFiles }, async (spellFile) => {
    const data = await readJSONFile(spellFile, SPELL_SCHEMA)
    for (const spell of data.rows) {
      if (!spell.SpellPrefabPath || meta.has(spell.SpellPrefabPath)) {
        continue
      }

      const slicePath = await resolveDynamicSliceFile(inputDir, path.join(slicesDir, spell.SpellPrefabPath))
      const sliceComponent = await readDynamicSliceFile(slicePath)
      if (!sliceComponent) {
        continue
      }
      const effects = new Set<string>()
      for (const entity of sliceComponent?.entities || []) {
        for (const component of entity?.components || []) {
          if (!isAreaStatusEffectComponent(component)) {
            continue
          }
          const facet = component.baseclass1?.m_serverfacetptr
          if (!isAreaStatusEffectComponentServerFacet(facet)) {
            continue
          }
          for (const effect of facet.m_addstatuseffects || []) {
            if (effect?.m_effectid) {
              effects.add(effect.m_effectid)
            }
          }
        }
      }
      meta.set(spell.SpellPrefabPath, {
        statusEffects: Array.from(effects),
      })
    }
  })

  const result: Array<{ PrefabPath: string; AreaStatusEffects: string[] }> = []
  for (const [slicePath, { statusEffects }] of meta.entries()) {
    if (statusEffects?.length) {
      result.push({
        PrefabPath: slicePath,
        AreaStatusEffects: statusEffects,
      })
    }
  }
  return result
}
