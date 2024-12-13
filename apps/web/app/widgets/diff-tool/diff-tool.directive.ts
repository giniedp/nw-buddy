import { Directive, effect, inject, input, untracked } from '@angular/core'
import { DiffToolStore } from './diff-tool.store'
import { DiffResource } from './types'

@Directive({
  standalone: true,
  selector: `[nwbDiffTool]`,
  providers: [DiffToolStore],
  exportAs: 'diffTool',
})
export class DiffToolDirective<T> {
  private store = inject(DiffToolStore)
  public resource = input<DiffResource<T>>(null, {
    alias: 'nwbDiffTool',
  })
  public versions = this.store.versions
  #fx = effect(() => {
    const resource = this.resource()
    //untracked(() => this.store.load(resource))
  })
}
