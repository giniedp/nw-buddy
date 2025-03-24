import { NgComponentOutlet, NgTemplateOutlet } from '@angular/common'
import { Component, Injector, TemplateRef, Type, input } from '@angular/core'

@Component({
  template: `
    @if (component) {
      <ng-component
        [ngComponentOutlet]="component"
        [ngComponentOutletInjector]="injector()"
        [ngComponentOutletInputs]="inputs()"
      />
    }
    @if (template) {
      <ng-component
        [ngTemplateOutlet]="template"
        [ngTemplateOutletInjector]="injector()"
        [ngTemplateOutletContext]="context()"
      />
    }
  `,
  imports: [NgTemplateOutlet, NgComponentOutlet],
})
export class ModalComponent {
  public content = input<Type<any> | TemplateRef<any>>(null)
  public inputs = input<Record<string, any>>(null)
  public context = input<any>(undefined)
  public injector = input<Injector>(null)

  protected get component() {
    const content = this.content()
    if (content instanceof TemplateRef) {
      return null
    }
    return content
  }

  protected get template() {
    const content = this.content()
    if (content instanceof TemplateRef) {
      return content
    }
    return null
  }
}
