import { NgComponentOutlet, NgTemplateOutlet } from '@angular/common'
import { Component, Injector, Input, TemplateRef, Type } from '@angular/core'

@Component({
  standalone: true,
  template: `
    @if (component) {
      <ng-component
        [ngComponentOutlet]="component"
        [ngComponentOutletInjector]="injector"
        [ngComponentOutletInputs]="inputs"
      />
    }
    @if (template) {
      <ng-component
        [ngTemplateOutlet]="template"
        [ngTemplateOutletInjector]="injector"
        [ngTemplateOutletContext]="context"
      />
    }
  `,
  imports: [NgTemplateOutlet, NgComponentOutlet],
})
export class ModalComponent {
  @Input()
  public content: Type<any> | TemplateRef<any> = null

  @Input()
  public inputs: Record<string, any> = null

  @Input()
  public context: any

  @Input()
  public injector: Injector = null

  protected get component() {
    if (this.content instanceof TemplateRef) {
      return null
    }
    return this.content
  }

  protected get template() {
    if (this.content instanceof TemplateRef) {
      return this.content
    }
    return null
  }
}
