import { ComponentRef, Injectable, ViewContainerRef } from '@angular/core'
import { BaseComponentWrapper, FrameworkComponentWrapper, WrappableInterface } from '@ag-grid-community/core'
import { AgFrameworkComponent } from './interfaces'

@Injectable()
export class AngularFrameworkComponentWrapper
  extends BaseComponentWrapper<WrappableInterface>
  implements FrameworkComponentWrapper
{
  private viewContainerRef: ViewContainerRef

  public setViewContainerRef(viewContainerRef: ViewContainerRef) {
    this.viewContainerRef = viewContainerRef
  }

  public createWrapper(OriginalConstructor: { new (): any }): WrappableInterface {
    let that = this

    class DynamicAgNg2Component extends BaseGuiComponent<any, AgFrameworkComponent<any>> implements WrappableInterface {
      override init(params: any): void {
        super.init(params)
        this.componentRef.changeDetectorRef.detectChanges()
      }

      protected createComponent(): ComponentRef<AgFrameworkComponent<any>> {
        return that.createComponent(OriginalConstructor)
      }

      hasMethod(name: string): boolean {
        return wrapper.getFrameworkComponentInstance()[name] != null
      }

      callMethod(name: string, args: IArguments): void {
        const componentRef = this.getFrameworkComponentInstance()
        return wrapper.getFrameworkComponentInstance()[name].apply(componentRef, args)
      }

      addMethod(name: string, callback: Function): void {
        ;(wrapper as any)[name] = callback
      }
    }

    let wrapper: DynamicAgNg2Component = new DynamicAgNg2Component()
    return wrapper
  }

  public createComponent<T>(componentType: { new (...args: any[]): T }): ComponentRef<T> {
    return this.viewContainerRef.createComponent(componentType)
  }
}

abstract class BaseGuiComponent<P, T extends AgFrameworkComponent<P>> {
  protected params: P
  protected componentRef: ComponentRef<T>

  protected init(params: P): void {
    this.params = params
    this.componentRef = this.createComponent()
    this.componentRef.instance.agInit(this.params)
  }

  public getGui(): HTMLElement {
    return this.componentRef.location.nativeElement
  }

  public destroy(): void {
    const instance = this.componentRef.instance
    if (instance && 'destroy' in instance && typeof instance.destroy === 'function') {
      instance.destroy()
    }
    if (this.componentRef) {
      this.componentRef.destroy()
    }
  }

  public getFrameworkComponentInstance(): any {
    return this.componentRef.instance
  }

  protected abstract createComponent(): ComponentRef<T>
}
