import { httpResource } from '@angular/common/http'
import { Component, computed, inject, input, signal, viewChild } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { NwModule } from '~/nw'
import { CodeEditorComponent, CodeEditorModule } from '../../ui/code-editor'
import { ObjectTreeComponent } from '../../ui/file-tree'
import { MonacoSliceExtensionDirective } from './monaco'
import { dynamicSliceOutliner, Entity, entityComponentNames } from './outline'
import { FileResource, PakService } from './pak.service'

@Component({
  selector: 'nwb-pak-preview-slice',
  template: `
    @let outline = outlineContent();
    <div class="flex flex-col order-1 min-w-96 max-w-[50vw]">
      <nwb-object-tree
        [items]="outline.items"
        [adapter]="outline.adapter"
        [open]="true"
        class="h-full flex-fill text-xs"
        (selected)="handleEntitySelection($event)"
      />
      <div class="flex-none flex flex-col gap-1 bg-base-300 p-1">
        <label>Components:</label>
        @for (item of entityComponents(); track $index) {
          <button class="btn btn-sm bt-ghost justify-start cursor-default" (click)="handleComponentSelection(item)">
            {{ item | nwHumanize }}
          </button>
        }
      </div>
    </div>
    <!-- <nwb-split-gutter #gutter="gutter" class="flex-none order-2" /> -->
    <nwb-code-editor
      class="flex-1 order-3"
      [nwbMonacoSliceExtension]=""
      (nwbMonacoAssetCommand)="service.handleMonacoAssetCommand($event)"
      [ngModel]="textContent.value()"
      [language]="'json'"
      [disabled]="true"
    />
  `,
  imports: [CodeEditorModule, MonacoSliceExtensionDirective, FormsModule, ObjectTreeComponent, NwModule],
  host: {
    class: 'flex flex-row h-full',
  },
})
export class PakPreviewSliceComponent {
  public service = inject(PakService)
  public source = input<FileResource>()
  protected editor = viewChild(CodeEditorComponent)
  protected selectedEntity = signal<Entity>(null)
  protected entityComponents = computed(() => entityComponentNames(this.selectedEntity()))

  protected textContent = httpResource.text(() => {
    return this.source().resource
  })

  protected outlineContent = computed(() => {
    const source = this.source()
    if (!source) {
      return {
        items: [],
        adapter: null,
      }
    }
    // if (source.ext !== 'dynamicslice') {
    //   return {
    //     items: [],
    //     adapter: null,
    //   }
    // }
    const text = this.textContent.value()
    return (
      dynamicSliceOutliner(text) || {
        items: [],
        adapter: null,
      }
    )
  })

  protected handleEntitySelection(item: Entity) {
    this.selectedEntity.set(item)
    this.scrollToEntity(item)
  }

  protected handleComponentSelection(name: string) {
    this.scrollToComponent(this.selectedEntity(), name)
  }

  private findEntityStart(item: Entity): { line: number; column: number; range: any } {
    const id = item?.id?.id
    const editor = this.editor()?.editor()
    if (!editor || !id) {
      return null
    }
    const model = editor.getModel()

    // looking for this shape
    //    "__type": "AZ::Entity",
    //    "id": {
    //      "__type": "EntityId",
    //      "id": "5625285448014657717"
    //    },
    //
    // - find lines with: "__type": "AZ::Entity"
    // - check line+3 for "id": ...

    const azEntityMatch = model.findMatches(`"__type":\\s*"AZ::Entity"`, false, true, false, null, false)
    for (const match of azEntityMatch) {
      const line = model.getLineContent(match.range.startLineNumber + 3)
      if (!line.match(`"id":\\s*"${id}"`)) {
        continue
      }
      return {
        line: match.range.startLineNumber,
        column: match.range.startColumn,
        range: match.range,
      }
    }
    return null
  }

  private scrollToEntity(item: Entity) {
    const pos = this.findEntityStart(item)
    if (!pos) {
      return
    }
    const editor = this.editor()?.editor()
    editor.setPosition({ column: pos.column, lineNumber: pos.line })
    if (pos.range) {
      editor.setSelection(pos.range)
    }
    editor.revealLineNearTop(pos.line)
  }

  private scrollToComponent(item: Entity, component: string) {
    const pos = this.findEntityStart(item)
    if (!pos) {
      return
    }

    const editor = this.editor()?.editor()
    const model = editor.getModel()
    const matches = model.findMatches(`"__type":\\s*"${component}"`, false, true, false, null, false)
    if (!matches.length) {
      return
    }
    for (const match of matches) {
      if (match.range.startLineNumber > pos.line) {
        editor.setPosition({ column: match.range.startColumn, lineNumber: match.range.startLineNumber })
        editor.setSelection(match.range)
        editor.revealLineNearTop(match.range.startLineNumber)
        return
      }
    }
  }

  protected isEntityRuntimeActive(entity: Entity) {
    return !!entity?.['isruntimeactive']
  }

  protected isEntityInTheWorld(entity: Entity) {
    for (const component of entityComponentNames(entity)) {
      if (component === 'PositionInTheWorldComponent') {
        return true
      }
    }
    return false
  }
}
