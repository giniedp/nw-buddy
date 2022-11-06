import { Injectable } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { from, Observable, switchMap, tap } from 'rxjs'
import { GearsetCreateMode, GearsetRecord, GearsetsDB } from './gearsets.db'
import { ItemInstance } from './item-instances.db'

export interface GearsetStoreState {
  gearset: GearsetRecord
  isLoading: boolean
}

@Injectable()
export class GearsetStore extends ComponentStore<GearsetStoreState> {
  public readonly gearset$ = this.select(({ gearset }) => gearset)
  public readonly gearsetId$ = this.select(({ gearset }) => gearset?.id)
  public readonly gearsetSlots$ = this.select(({ gearset }) => gearset?.slots)
  public readonly gearsetName$ = this.select(({ gearset }) => gearset?.name)
  public readonly isLinkMode$ = this.select(({ gearset }) => gearset?.createMode !== 'copy')
  public readonly isCopyMode$ = this.select(({ gearset }) => gearset?.createMode === 'copy')
  public readonly isLoading$ = this.select(({ isLoading }) => isLoading)

  public constructor(private db: GearsetsDB) {
    super({
      gearset: null,
      isLoading: true
    })
  }

  /**
   * Loads given set into the form
   */
  public readonly load = this.updater((state, gearset: GearsetRecord | null) => {
    return {
      ...state,
      gearset: gearset,
      isLoading: false,
    }
  })

  /**
   * Loads set by id into form
   */
  public readonly loadById = this.effect((value$: Observable<string>) => {
    return value$.pipe(
      switchMap((id: string) => {
        return this.db.observeByid(id).pipe(
          tap({
            next: (gearset) => this.load(gearset),
            error: (e) => console.error(e),
          })
        )
      })
    )
  })

  /**
   *
   */
  public readonly update = this.effect<GearsetRecord>((value$) => {
    return value$.pipe(switchMap((record) => this.writeRecord(record)))
  })

  /**
   * Updates the name of the item and writes to database
   */
  public readonly updateName = this.effect<{ name: string }>((value$) => {
    return value$.pipe(
      switchMap(({ name }) => {
        const gearset = this.get().gearset
        return this.writeRecord({
          ...gearset,
          name: name,
        })
      })
    )
  })

  /**
   * Updates a gearset slot
   */
  public readonly updateSlot = this.effect<{ slot: string; value: string | ItemInstance }>((value$) => {
    return value$.pipe(
      switchMap(({ slot, value }) => {
        const gearset = this.get().gearset
        const slots = {
          ...(gearset.slots || {}),
        }
        if (value) {
          slots[slot] = value
        } else {
          delete slots[slot]
        }
        return this.writeRecord({
          ...gearset,
          slots: slots,
        })
      })
    )
  })

  /**
   * Changes the createMode
   */
  public readonly updateMode = this.effect<{ mode: GearsetCreateMode }>((mode$) => {
    return mode$.pipe(
      switchMap(({ mode }) => {
        const gearset = this.get().gearset
        return this.writeRecord({
          ...gearset,
          createMode: mode,
        })
      })
    )
  })

  public readonly destroySet = this.effect((value$) => {
    return value$.pipe(
      switchMap(() => {
        const id = this.get().gearset.id
        return this.db.destroy(id)
      })
    )
  })

  private writeRecord(record: GearsetRecord) {
    return from(this.db.update(record.id, record)).pipe(
      tap({
        next: (value) => this.load(value),
        error: (e) => console.error(e),
      })
    )
  }
}
