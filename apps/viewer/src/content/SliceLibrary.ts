import { LazySliceSet, type ViewerSlice } from '../api'

/**
 * Slice data of the loaded regions and the level, by asset reference key
 *
 * @remarks
 * Regions and the level add their slice set when their data is loaded and remove it on unload, so the data lives only
 * as long as its owner. Lookups search all sets, a slice spawned in one region may be defined in another one.
 * A set is either a plain record or a {@link LazySliceSet} that parses its slices on first use.
 */
export class SliceLibrary {
  private sets = new Map<object, Record<string, ViewerSlice> | LazySliceSet>()

  /**
   * Adds (or replaces) the slice set of an owner, e.g. a region
   */
  public add(owner: object, slices: Record<string, ViewerSlice> | LazySliceSet | null | undefined) {
    if (slices) {
      this.sets.set(owner, slices)
    }
  }

  /**
   * Removes the slice set of an owner. Spawners that already resolved their slice keep the data.
   */
  public remove(owner: object) {
    this.sets.delete(owner)
  }

  /**
   * Finds a slice in the sets of all owners
   */
  public get(key: string): ViewerSlice | undefined {
    for (const slices of this.sets.values()) {
      const slice = slices instanceof LazySliceSet ? slices.get(key) : slices[key]
      if (slice) {
        return slice
      }
    }
    return undefined
  }

  /**
   * Number of slice sets (owners)
   */
  public get setCount() {
    return this.sets.size
  }
}
