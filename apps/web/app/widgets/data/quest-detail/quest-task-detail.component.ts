import { Component, Input, inject } from '@angular/core'
import { QuestTaskDetailStore } from './quest-task-detail.store'
import { QuestTaskTreeComponent } from './quest-task-tree.component'

@Component({
  selector: 'nwb-quest-task-detail',
  template: ` <nwb-quest-task-tree [task]="task" [children]="children" /> `,
  providers: [QuestTaskDetailStore],
  imports: [QuestTaskTreeComponent],
  host: {
    class: 'block',
  },
})
export class QuestTaskDetailComponent {
  protected store = inject(QuestTaskDetailStore)
  @Input()
  public set taskId(value: string) {
    this.store.load(value)
  }

  public get task() {
    return this.store.task()
  }
  public get children() {
    return this.store.children()
  }
}
