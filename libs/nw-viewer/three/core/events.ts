import { Observable } from "rxjs"

/**
 * @public
 */
export type EventHandler<T extends any[] = any[]> = (...args: T) => void

export class EventObserver<T extends any[] = any[]> {
  private emitter: EventEmitter
  private name: string

  public constructor(target: EventEmitter, name: string) {
    this.emitter = target
    this.name = name
  }

  public add(callback: EventHandler<T>) {
    return this.emitter.on(this.name, callback)
  }

  public remove(callback: EventHandler<T>) {
    return this.emitter.off(this.name, callback)
  }

  public once(callback: EventHandler<T>) {
    return this.emitter.once(this.name, callback)
  }

  public trigger(...args: T) {
    return this.emitter.notify(this.name, ...args)
  }

  public asObservable() {
    return new Observable<T>((subscriber) => {
      const handler = (...args: T) => subscriber.next(args)
      this.emitter.on(this.name, handler)
      return () => {
        this.emitter.off(this.name, handler)
      }
    })
  }
}

/**
 * Base class with an event system
 *
 * @remarks
 * Implements logic for binding and unbinding methods to and from events.
 * The code is taken from the {@link https://github.com/jashkenas/backbone | Backbone} project
 *
 * @public
 */
export class EventEmitter {

  private events: { [key: string]: EventHandler[] } = {}

  /**
   * Adds an event listener
   *
   * @remarks
   * Passing `"all"` will listen on all events fired.
   * @param name - The event name to listen to
   * @param handler - The handler function to call when the event fires
   */
  public on(name: 'all'|string, handler: EventHandler) {
    this.events ||= {}
    this.events[name] ||= []
    this.events[name].push(handler)
    return () => this.off(name, handler)
  }

  /**
   * Adds an event listener that will only be called once
   *
   * @param name - The event name to listen to
   * @param handler - The handler function to call when the event fires
   */
  public once(name: string, callback: EventHandler) {
    const once = function () {
      if (once.called) { return }
      once.called = true
      once.parent.off(name, once)
      once._callback.apply(this, arguments)
    }
    once.called = false
    once.parent = this
    once._callback = callback
    return this.on(name, once)
  }

  /**
   * Remove one or many callbacks.
   *
   * @remarks
   * - If `context` is null, removes all callbacks with that function.
   * - If `callback` is null, removes all callbacks for the event.
   * - If `name` is null, removes all bound callbacks for all events.
   *
   * @param name - The name of the event to unbind from
   * @param handler - The function to unbind
   */
  public off(name?: string, handler?: EventHandler) {
    if (!this.events) {
      return this
    }
    if (!name && !handler) {
      this.events = {}
      return this
    }
    if (!this.events[name]) {
      return this
    }
    if (!handler) {
      delete this.events[name]
      return this
    }
    this.events[name] = this.events[name].filter((it) => it !== handler)
    return this
  }

  /**
   * Trigger one or many events, firing all bound callbacks.
   *
   * @remarks
   * Callbacks are passed the same arguments as `trigger` is, apart from the event name
   * (unless you're listening on `"all"`, which will cause your callback to
   * receive the true name of the event as the first argument).
   *
   * @param name - The name of the event to trigger
   */
  public notify(name: string, ...args: any[]) {
    if (!this.events) {
      return this
    }
    let list = this.events[name]
    if (list) {
      for (let i = 0; i < list.length; i++) {
        list[i].apply(this, args)
      }
    }
    list = this.events['all']
    if (list) {
      for (let i = 0; i < list.length; i++) {
        list[i].apply(this, args)
      }
    }
    return this
  }

  public createObserver<T1>(name: string): EventObserver<[T1]>
  public createObserver<T1, T2>(name: string): EventObserver<[T1, T2]>
  public createObserver<T1, T2, T3>(name: string): EventObserver<[T1, T2, T3]>
  public createObserver<T extends any[]>(name: string) {
    return new EventObserver<T>(this, name)
  }
}
