import { Injectable, Output, inject } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { NW_FALLBACK_ICON } from '@nw-data/common'
import { Mounts } from '@nw-data/generated'
import { NwDbService } from '~/nw'
import { ModelViewerService } from '~/widgets/model-viewer'

@Injectable()
export class MountDetailStore extends ComponentStore<{ mountId: string }> {
  public readonly mountId$ = this.select(({ mountId }) => mountId)

  @Output()
  public readonly mount$ = this.select(this.db.mount(this.mountId$), (it) => it)

  public readonly icon$ = this.select(this.mount$, (it) => it?.IconPath || NW_FALLBACK_ICON)
  public readonly name$ = this.select(this.mount$, (it) => it?.DisplayName)
  public readonly type$ = this.select(this.mount$, (it) => it?.MountType)
  public readonly description$ = this.select(this.mount$, (it) => it?.Description)
  public readonly note$ = this.select(this.mount$, (it) => it?.NOTES)
  public readonly models$ = this.select(inject(ModelViewerService).byMountId(this.mountId$), (it) => it)

  public constructor(private db: NwDbService) {
    super({ mountId: null })
  }

  public load(idOrItem: string | Mounts) {
    if (typeof idOrItem === 'string') {
      this.patchState({ mountId: idOrItem })
    } else {
      this.patchState({ mountId: idOrItem?.MountId })
    }
  }
}
