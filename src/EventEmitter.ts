import { parsePathPattern, PathParams } from './utils/index'

export type EventEmitterParams = PathParams

export type EventEmitterHandler = (
  payload: any,
  params: EventEmitterParams
) => any

export interface EventEmitterEvent {
  path: string
  match: (path: string) => object | boolean
  handlers: Array<EventEmitterHandler>
}

/**
 * An event emitter that uses OSC style path's as event names.
 */
export class EventEmitter {
  events: { [path: string]: EventEmitterEvent } = {}

  /**
   * Add a new event listener.
   */
  on(path: string, handler: EventEmitterHandler) {
    const { events } = this
    events[path] = events[path] ?? {
      path,
      match: parsePathPattern(path),
      handlers: [],
    }
    events[path].handlers.push(handler)
  }

  /**
   * Remove an event listener.
   */
  off(path: string, handler: EventEmitterHandler) {
    const handlers = this.events[path]?.handlers
    const index = handlers?.indexOf(handler)
    if (index !== undefined && index >= 0) handlers.splice(index, 1)
  }

  /**
   * Add an event listener that gets removed again after it's first call.
   */
  once(path: string, handler: EventEmitterHandler) {
    const handlerOnce = (...args: any) => {
      handler.call(this, ...args)
      this.off(path, handlerOnce)
    }
    this.on(path, handlerOnce)
  }

  /**
   * Emit an event.
   */
  emit(path: string, payload: any) {
    for (const { match, handlers } of Object.values(this.events)) {
      if (!handlers.length) continue
      const params = match(path)
      if (params) {
        handlers.forEach(handler => handler.call(this, payload, params))
      }
    }
  }
}
