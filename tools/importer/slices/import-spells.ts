import * as fs from 'fs'
import * as path from 'path'
import { z } from 'zod'
import { fileContext } from '../../utils/file-context'
import { readJSONFile } from '../../utils/file-utils'
import { walkJsonObjects } from '../../utils/walk-json-object'
import { isAreaStatusEffectComponentServerFacet } from './types/dynamicslice'

const SPELL_SCHEMA = z.array(
  z.object({
    SpellPrefabPath: z.string().optional(),
  })
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
      const slicePath = ctxSlices.path(spell.SpellPrefabPath + '.dynamicslice.json')
      if (!fs.existsSync(slicePath)) {
        continue
      }
      const effects = new Set<string>()
      const sliceData = await readJSONFile(slicePath)
      walkJsonObjects(sliceData, (obj) => {
        if (obj && isAreaStatusEffectComponentServerFacet(obj)) {
          obj.m_addstatuseffects
            ?.map((it) => it?.m_effectid)
            .filter((it) => !!it)
            ?.forEach((effect) => {
              effects.add(effect)
            })
        }
      })
      meta.set(spell.SpellPrefabPath, {
        statusEffects: Array.from(effects),
      })
    }
  }
  const result: Array<{ PrefabPath: string, AreaStatusEffects: string [] }> = []
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
