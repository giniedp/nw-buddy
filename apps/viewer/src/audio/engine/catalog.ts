import {
  parseAtlControls,
  parseAtlPreloads,
  parseTractMapping,
  TriggerBankMap,
  type AtlControls,
  type AtlPreload,
} from '../wwise'

/**
 * Text and binary catalogs the engine needs before anything plays, all fetched as plain game files
 */
export interface AudioCatalog {
  atl: AtlControls
  preloads: Map<string, AtlPreload>
  triggerBanks: TriggerBankMap
  /**
   * tract name → wildlife preload prefix, e.g. `amb_wildlife_coast_`
   */
  tractBanks: Map<string, string>
  /**
   * Known bank file names (lower case with `.bnk`), from the preloads.
   * They name 1899 of the 1904 banks the trigger map references, the rest are quest banks.
   */
  bankFiles: Set<string>
}

export async function loadAudioCatalog(baseUrl: string, signal?: AbortSignal): Promise<AudioCatalog> {
  const file = (path: string) => `${baseUrl}/files/${path}`
  const text = async (path: string) => {
    const res = await fetch(file(path), { signal })
    if (!res.ok) {
      throw new Error(`${path}: ${res.status}`)
    }
    return res.text()
  }
  const binary = async (path: string) => {
    const res = await fetch(file(path), { signal })
    if (!res.ok) {
      throw new Error(`${path}: ${res.status}`)
    }
    return new Uint8Array(await res.arrayBuffer())
  }

  const [atlXml, preloadXml, tbm, tractCsv] = await Promise.all([
    text('libs/gameaudio/wwise/atl_controls.xml'),
    text('libs/gameaudio/wwise/preloaddata.xml'),
    binary('libs/gameaudio/wwise/triggerbankmapatlbin.bin'),
    text('sounds/wwise/soundbank_tract_mapping.csv'),
  ])
  const preloads = parseAtlPreloads(preloadXml)
  const bankFiles = new Set<string>()
  for (const preload of preloads.values()) {
    for (const name of preload.files) {
      bankFiles.add(name)
    }
  }
  return {
    atl: parseAtlControls(atlXml),
    preloads,
    triggerBanks: new TriggerBankMap(tbm, bankFiles),
    tractBanks: parseTractMapping(tractCsv),
    bankFiles,
  }
}
