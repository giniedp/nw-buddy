const vendors = ['', 'moz', 'webkit', 'ms', 'o']

export const getTime: () => number = (() => {
  if (window.performance && typeof window.performance.now === 'function') {
    return () => window.performance.now()
  }
  return () => Date.now()
})()

/**
 * @public
 * @param el
 * @param name
 * @param variants
 */
export function vendorProperty<T extends Element | Document>(el: T, name: keyof T, ...variants: string[]): string {
  for (const prefix of vendors) {
    if (prefix) {
      const vendorName = prefix + String(name)[0].toUpperCase() + String(name).substr(1)
      if (vendorName in el) {
        return vendorName
      }
    } else if (name in el) {
      return name.toString()
    }
  }
  for (const variant of variants) {
    if (variant in el) {
      return variant
    }
  }
  return null
}

/**
 * @public
 * @param el
 * @param name
 * @param variants
 */
export function vendorEvent<T extends Element | Document>(el: T, name: keyof T, ...variants: string[]): string {
  const suffix = name.toString().replace(/^on/, '')
  for (const prefix of vendors) {
    const event = 'on' + prefix + suffix
    if (event in el) {
      return event
    }
  }
  for (const variant of variants) {
    if (variant in el) {
      return variant
    }
  }
  return null
}


/**
 * @public
 */
export class PointerLock {

  private pointerlockchange = vendorEvent(document as any, 'pointerlockchange')
  private pointerlockerror = vendorEvent(document as any, 'pointerlockerror')
  private requestPointerLockName = vendorProperty(document as any, 'requestPointerLock')
  private exitPointerLockName = vendorProperty(document as any, 'exitPointerLock')
  private pointerLockElementName = vendorProperty(document as any, 'pointerLockElement')

  public get isSupported() {
    return !!this.exitPointerLockName
  }

  public get pointerLockElement() {
    return document.pointerLockElement || null
  }

  public onChange(callback: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) {
    if (this.pointerlockchange) {
      document.addEventListener(this.pointerlockchange, callback, options)
    }
  }
  public offChange(callback: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) {
    if (this.pointerlockchange) {
      document.removeEventListener(this.pointerlockchange, callback, options)
    }
  }

  public onError(callback: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) {
    if (this.pointerlockerror) {
      document.addEventListener(this.pointerlockerror, callback, options)
    }
  }
  public offError(callback: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) {
    if (this.pointerlockerror) {
      document.removeEventListener(this.pointerlockerror, callback, options)
    }
  }

  public requestLock(target: Element) {
    this.requestPointerLockName = this.requestPointerLockName || vendorProperty(target, 'requestPointerLock')
    if (this.requestPointerLockName) {
      target[this.requestPointerLockName as 'requestPointerLock']()
    }
  }

  public exitLock() {
    if (this.exitPointerLockName) {
      document[this.exitPointerLockName as 'exitPointerLock']()
    }
  }
}
