import * as fs from 'fs'
import * as path from 'path'
import { replaceExtname } from '../../utils'
import { RewriteFile } from './import-datatables'

export function rewriteImagePathRule(inputDir: string): RewriteFile {
  return {
    file: /_itemdefinitions_master_/,
    rules: [
      (obj, { getTables }) => {
        function findIcon(id: string) {
          return (
            getTables(/_itemappearancedefinitions/).find((it) => id === it.ItemID)?.IconPath ||
            getTables(/_itemdefinitions_weaponappearances/).find((it) => id === it.WeaponAppearanceID)?.IconPath ||
            getTables(/_itemdefinitions_instrumentsappearances/).find((it) => id === it.WeaponAppearanceID)?.IconPath
          )
        }
        let candidates = [
          obj.IconPath,
          obj.ArmorIconM ? findIcon(obj.ArmorIconM) : null,
          obj.ArmorIconF ? findIcon(obj.ArmorIconF) : null,
          obj.WeaponAppearanceOverride ? findIcon(obj.WeaponAppearanceOverride) : null,
        ]
        if (obj.ItemType && obj.ArmorAppearanceM) {
          candidates.push(`lyshineui/images/icons/items/${obj.ItemType}/${obj.ArmorAppearanceM}.png`)
        }
        if (obj.ItemType && obj.ArmorAppearanceF) {
          candidates.push(`lyshineui/images/icons/items/${obj.ItemType}/${obj.ArmorAppearanceF}.png`)
        }
        if (obj.ItemType && obj.WeaponAppearanceOverride) {
          candidates.push(`lyshineui/images/icons/items/${obj.ItemType}/${obj.WeaponAppearanceOverride}.png`)
        }

        for (const icon of candidates) {
          if (icon && fs.existsSync(path.join(inputDir, replaceExtname(icon, '.png')))) {
            obj.IconPath = replaceExtname(icon, '.png')
            return
          }
        }
        obj.IconPath = null
        // console.log(
        //   'icon missing',
        //   obj.ItemID,
        //   candidates.filter((it) => !!it)
        // )
      },
    ],
  }
}