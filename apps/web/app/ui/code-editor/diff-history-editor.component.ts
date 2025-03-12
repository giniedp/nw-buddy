import { Component, computed, input, signal } from '@angular/core'
import { DiffEditorComponent } from './diff-editor.component'

export type DataWithVersion<T = unknown> = {
  version: string
  data: T
}

@Component({
  selector: 'nwb-diff-history-editor',
  template: `
    <ul class="menu bg-base-200 w-52 flex-nowrap p-0 [&_li>*]:rounded-none flex-none overflow-y-auto">
      @for (item of files(); track $index; let i = $index) {
        <li [class.text-primary]="selection() === i">
          <a (click)="selection.set(i)">{{ item.name }}</a>
        </li>
      }
    </ul>
    <nwb-diff-editor
      class="flex-1"
      [leftValue]="leftContent()"
      [rightValue]="rightContent()"
      [language]="'json'"
      [readonly]="true"
    />
  `,
  imports: [DiffEditorComponent],
  host: {
    class: 'flex flex-row',
  },
})
export class DiffHistoryEditorComponent {
  public history = input<DataWithVersion[]>()

  protected selection = signal<number>(0)
  protected files = computed(() => selectFiles(this.history()))
  protected leftContent = computed(() => this.files()[this.selection() + 1]?.content)
  protected rightContent = computed(() => this.files()[this.selection()]?.content)
}

function selectFiles(history: DataWithVersion[]) {
  const result: Array<{ name: string; content: string }> = []
  for (const { version, data } of history) {
    result.push({ name: version, content: toContent(data) })
  }
  return result
}

function toContent(item: unknown) {
  if (typeof item === 'string') {
    return item
  }
  return JSON.stringify(item, null, 2)
}
