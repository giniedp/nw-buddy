
const SIZE_REGEX = /(XSmall|Tiny|Small|Medium|Large|Huge)/i
const SIZE_TOKENS: GatherableNodeSize[] = ['XSmall', 'Tiny', 'Small', 'Medium', 'Large', 'Huge']
const SIZE_COLORS: Record<GatherableNodeSize, string> = {
  Tiny: '#f28c18',
  XSmall: '#51A800',
  Small: '#51A800',
  Medium: '#2563EB',
  Large: '#DC2626',
  Huge: '#6D3A9C',
}
const SIZE_LABELS: Record<GatherableNodeSize, string> = {
  Huge: 'XL',
  Large: 'LG',
  Medium: 'MD',
  Small: 'SM',
  Tiny: 'XS',
  XSmall: 'XXS',
}
const SIZE_SCALE: Record<GatherableNodeSize, number> = {
  Huge: 1.5,
  Large: 1.25,
  Medium: 1,
  Small: 0.75,
  Tiny: 0.5,
  XSmall: 0.5,
}

export type GatherableNodeSize = 'XSmall' | 'Tiny' | 'Small' | 'Medium' | 'Large' | 'Huge'

export function getGatherableNodeSizes(): GatherableNodeSize[] {
  return [...SIZE_TOKENS]
}

export function getGatherableNodeSize(gatherableId: string): GatherableNodeSize {
  if (!gatherableId){
    return null
  }
  return gatherableId?.match(SIZE_REGEX)?.[1] as GatherableNodeSize
}

export interface NodeSizeProps {
  size: GatherableNodeSize
  color: string
  label: string
  scale: number
}

export function describeNodeSize(size: GatherableNodeSize): NodeSizeProps {
  return {
    size,
    color: SIZE_COLORS[size] || SIZE_COLORS.Medium,
    label: SIZE_LABELS[size] || SIZE_LABELS.Medium,
    scale: SIZE_SCALE[size] || SIZE_SCALE.Medium,
  }
}
