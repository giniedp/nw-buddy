import { NwMaterialPlugin } from './nw-material-plugin'
import type { AbstractMesh, PBRMaterial } from '@babylonjs/core'
export interface NwMaterialParams {
  MaskRDyeOverride: number
  MaskRDye: number
  MaskGDyeOverride: number
  MaskGDye: number
  MaskBDyeOverride: number
  MaskBDye: number
  MaskASpecDye: number
  RDyeSlotDisabled: string
  GDyeSlotDisabled: string
  BDyeSlotDisabled: string
  ADyeSlotDisabled: string

  MaskR: number
  MaskROverride: number
  MaskRColor: string
  MaskG: number
  MaskGOverride: number
  MaskGColor: string
  MaskB: number
  MaskBOverride: number
  MaskBColor: string
  MaskASpec: number
  MaskASpecColor: string
  MaskAGloss: number
  MaskAGlossShift: number
  EmissiveColor: string
  EmissiveIntensity: number
}

export function updateNwMaterial({
  meshes,
  appearance,
  dyeR,
  dyeROverride,
  dyeRColor,
  dyeG,
  dyeGOverride,
  dyeGColor,
  dyeB,
  dyeBOverride,
  dyeBColor,
  dyeA,
  dyeAOverride,
  dyeAColor,
  glossShift,
  debugMask,
}: {
  meshes: AbstractMesh[]
  appearance?: NwMaterialParams
  dyeR?: number
  dyeROverride?: number
  dyeRColor?: string
  dyeG?: number
  dyeGOverride?: number
  dyeGColor?: string
  dyeB?: number
  dyeBOverride?: number
  dyeBColor?: string
  dyeA?: number
  dyeAOverride?: number
  dyeAColor?: string
  glossShift?: number
  debugMask?: boolean
}) {
  for (const mesh of meshes) {
    const mtl = NwMaterialPlugin.getPlugin(mesh.material)
    if (!mtl) {
      continue
    }

    if (!appearance) {
      mtl.isMaskEnabled = false
      return
    }

    mtl.isMaskEnabled = true
    mtl.debugMask = debugMask

    const maskR = getMaskSettings({
      dye: dyeR ?? appearance.MaskRDye ?? appearance.MaskR ?? 0,
      dyeOverride: dyeROverride ?? appearance.MaskRDyeOverride ?? appearance.MaskROverride ?? 0,
      dyeColor: dyeRColor ?? null,
      mask: appearance.MaskR ?? 0,
      maskOverride: appearance.MaskROverride ?? 0,
      maskColor: appearance.MaskRColor,
    })
    mtl.nwMaskR = maskR.mask
    mtl.nwMaskROverride = maskR.maskOverride
    mtl.nwMaskRColor = maskR.maskColor

    const maskG = getMaskSettings({
      dye: dyeG ?? appearance.MaskGDye ?? appearance.MaskG ?? 0,
      dyeOverride: dyeGOverride ?? appearance.MaskGDyeOverride ?? appearance.MaskGOverride ?? 0,
      dyeColor: dyeGColor ?? null,
      mask: appearance.MaskG ?? 0,
      maskOverride: appearance.MaskGOverride ?? 0,
      maskColor: appearance.MaskGColor,
    })
    mtl.nwMaskG = maskG.mask
    mtl.nwMaskGOverride = maskG.maskOverride
    mtl.nwMaskGColor = maskG.maskColor

    const maskB = getMaskSettings({
      dye: dyeB ?? appearance.MaskBDye ?? appearance.MaskB ?? 0,
      dyeOverride: dyeBOverride ?? appearance.MaskBDyeOverride ?? appearance.MaskBOverride ?? 0,
      dyeColor: dyeBColor ?? null,
      mask: appearance.MaskB ?? 0,
      maskOverride: appearance.MaskBOverride ?? 0,
      maskColor: appearance.MaskBColor,
    })
    mtl.nwMaskB = maskB.mask
    mtl.nwMaskBOverride = maskB.maskOverride
    mtl.nwMaskBColor = maskB.maskColor

    const maskA = getMaskSettings({
      dye: dyeA ?? appearance.MaskASpecDye ?? appearance.MaskASpec ?? 0,
      dyeOverride: dyeAOverride ?? appearance.MaskASpecDye ?? appearance.MaskASpec ?? 0,
      dyeColor: dyeAColor ?? null,
      mask: appearance.MaskASpec ?? 0,
      maskOverride: appearance.MaskASpec ?? 0,
      maskColor: appearance.MaskASpecColor,
    })
    mtl.nwMaskASpecOverride = maskA.mask
    mtl.nwMaskASpec = maskA.maskColor
    mtl.nwMaskGlossShift = glossShift ?? appearance.MaskAGlossShift ?? 0.5
    mtl.nwMaskGloss = appearance.MaskAGloss ?? 0

    const pbr = mesh.material as PBRMaterial
    if (pbr.emissiveTexture) {
      const emCol = parseColor(appearance.EmissiveColor)
      if (!appearance.EmissiveIntensity && !(emCol.r || emCol.g || emCol.b)) {
        // assume default emissive color (or whatever is set in the material)
        // otherwise breaks the 2hGreatswordCondemedSacrariumT5 weapon appearance
      } else {
        pbr.emissiveColor.set(emCol.r, emCol.g, emCol.b)
        pbr.emissiveIntensity = Math.log(1 + (appearance.EmissiveIntensity ?? 0))
      }
    }
  }
}

function parseColor(color: string) {
  color = (color || '').toLowerCase()
  if (/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/.test(color)) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/.exec(color)
    if (result) {
      return {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    }
  }
  if (color.includes(',')) {
    const [r, g, b] = color.split(',').map((it) => parseFloat(it))
    return {
      r: r,
      g: g,
      b: b,
    }
  }
  return {
    r: 0,
    g: 0,
    b: 0,
  }
}

function getMaskSettings(options: {
  dye: number
  dyeOverride: number
  dyeColor: string | null
  mask: number
  maskOverride: number
  maskColor: string | null
}) {
  if (options.dye && options.dyeColor) {
    const rgb = parseColor(options.dyeColor)
    return {
      mask: options.dye || 0,
      maskOverride: options.dyeOverride || 0,
      maskColor: {
        r: rgb.r || 0,
        g: rgb.g || 0,
        b: rgb.b || 0,
      },
    }
  }
  if (options.mask && options.maskColor) {
    const rgb = parseColor(options.maskColor)
    return {
      mask: options.mask || 0,
      maskOverride: options.maskOverride || 0,
      maskColor: {
        r: rgb.r || 0,
        g: rgb.g || 0,
        b: rgb.b || 0,
      },
    }
  }
  return {
    mask: 0,
    maskOverride: 0,
    maskColor: {
      r: 0,
      g: 0,
      b: 0,
    },
  }
}
