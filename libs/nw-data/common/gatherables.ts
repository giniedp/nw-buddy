
const SIZE_REGEX = /(Tiny|Small|Medium|Large|Huge)/i
const SIZE_TOKENS: GatherableNodeSize[] = ['Tiny', 'Small', 'Medium', 'Large', 'Huge']

export type GatherableNodeSize = 'Tiny' | 'Small' | 'Medium' | 'Large' | 'Huge'

export function getGatherableNodeSizes(): GatherableNodeSize[] {
  return [...SIZE_TOKENS]
}

export function getGatherableNodeSize(gatherableId: string): GatherableNodeSize {
  if (!gatherableId){
    return null
  }
  return gatherableId?.match(SIZE_REGEX)?.[1] as GatherableNodeSize
}
