import * as path from 'path'
import { z } from 'zod'
import { fileContext } from '../../utils/file-context'
import { readJSONFile } from '../../utils/file-utils'
import { isAreaStatusEffectComponent, isAreaStatusEffectComponentServerFacet } from './types/dynamicslice'
import { readDynamicSliceFile, resolveDynamicSliceFile } from './utils'

const SPELL_SCHEMA = z.array(
  z.object({
    SpellPrefabPath: z.string().optional(),
  }),
)

export async function importSpells({ inputDir }: { inputDir: string }) {
  const ctxTables = fileContext(path.join(inputDir, 'sharedassets', 'springboardentitites', 'datatables'))
  const ctxSlices = fileContext(path.join(inputDir, 'slices'))
  const spellFiles = await ctxTables.glob('javelindata_spelltable_*.json')

  const meta = new Map<
    string,
    {
      statusEffects: string[]
    }
  >()

  for (const spellFile of spellFiles) {
    const data = await readJSONFile(spellFile, SPELL_SCHEMA)
    for (const spell of data) {
      if (!spell.SpellPrefabPath || meta.has(spell.SpellPrefabPath)) {
        continue
      }

      const slicePath = await resolveDynamicSliceFile(inputDir, ctxSlices.path(spell.SpellPrefabPath))
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
  }
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
