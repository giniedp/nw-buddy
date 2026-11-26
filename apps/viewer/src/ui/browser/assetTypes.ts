import { createSignal, type Accessor } from 'solid-js'
import type { AssetType, NwbtClient, TypeGroup } from '../../api/browse'
import svgAtom from '../icons/atom.svg?raw'
import svgBrain from '../icons/brain.svg?raw'
import svgCube from '../icons/cube.svg?raw'
import svgFileAudio from '../icons/file-audio.svg?raw'
import svgFileCode from '../icons/file-code.svg?raw'
import svgFileDashedLine from '../icons/file-dashed-line.svg?raw'
import svgFileImage from '../icons/file-image.svg?raw'
import svgFileLines from '../icons/file-lines.svg?raw'
import svgFile from '../icons/file.svg?raw'
import svgFilm from '../icons/film.svg?raw'
import svgGear from '../icons/gear.svg?raw'
import svgLayerGroup from '../icons/layer-group.svg?raw'
import svgMountain from '../icons/mountain.svg?raw'
import svgPalette from '../icons/palette.svg?raw'
import svgPersonRunning from '../icons/person-running.svg?raw'
import svgSparkles from '../icons/sparkles.svg?raw'
import svgTable from '../icons/table.svg?raw'
import svgWindow from '../icons/window.svg?raw'

/**
 * The asset types of the archive, a file's `type` is an index into it
 */
export class AssetTypes {
  private readonly nwbt: NwbtClient
  private readonly types: Accessor<AssetType[]>
  private readonly setTypes: (list: AssetType[]) => void
  private loading: Promise<void> | null = null

  public constructor(nwbt: NwbtClient) {
    this.nwbt = nwbt
    const [types, setTypes] = createSignal<AssetType[]>([])
    this.types = types
    this.setTypes = setTypes
  }

  /**
   * The types, loaded once. Empty until then.
   */
  public list(): Accessor<AssetType[]> {
    this.loading ??= this.nwbt.getTypes().then(
      (list) => {
        this.setTypes(list)
      },
      (err) => {
        this.loading = null
        console.error('asset types not loaded:', String(err))
      },
    )
    return this.types
  }
}

const GROUP_ICONS: Record<TypeGroup, string> = {
  other: svgFile,
  texture: svgFileImage,
  geometry: svgCube,
  animation: svgPersonRunning,
  material: svgPalette,
  slice: svgLayerGroup,
  script: svgFileCode,
  data: svgTable,
  ui: svgWindow,
  audio: svgFileAudio,
  video: svgFilm,
  effects: svgSparkles,
  physics: svgAtom,
  terrain: svgMountain,
  ai: svgBrain,
  config: svgGear,
  hidden: svgFileDashedLine,
}

/**
 * The icon of a file by the group of its type. Ungrouped text files get the text icon.
 */
export function typeIcon(type: AssetType | undefined): string {
  if (!type) {
    return svgFile
  }
  if (type.group === 'other' && type.format !== 'binary') {
    return svgFileLines
  }
  return GROUP_ICONS[type.group]
}
