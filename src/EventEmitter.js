// @ts-check

import { parsePathPattern } from './utils/parsePathPattern.js'

/** @typedef {(payload: any, params: object) => any} EventEmitterHandler */

/** 
 * @typedef {{
 *  path: string
 *  match: (path: string) => object | boolean
 *  handlers: Array<EventEmitterHandler>
 * }} EventEmitterEvent
 */

/**
 * An event emitter that uses OSC style path's as event names.
 */
export class EventEmitter {
  /** @type {Object<string, EventEmitterEvent>} */
  events = {}

  /**
   * Add a new event listener.
   * @param {string} path 
   * @param {EventEmitterHandler} handler
   */
  on(path, handler) {
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
   * @param {string} path 
   * @param {EventEmitterHandler} handler 
   */
  off(path, handler) {
    const handlers = this.events[path]?.handlers
    const index = handlers?.indexOf(handler)
    if (index !== undefined && index >= 0) handlers.splice(index, 1)
  }

  /**
   * Add an event listener that gets removed again after it's first call.
   * @param {string} path 
   * @param {EventEmitterHandler} handler 
   */
  once(path, handler) {
    /** @param {any} args */
    const handlerOnce = (...args) => {
      handler.call(this, ...args)
      this.off(path, handlerOnce)
    }
    this.on(path, handlerOnce)
  }

  /**
   * Emit an event.
   * @param {string} path 
   * @param {any} payload 
   */
  emit(path, payload) {
    for (const { match, handlers } of Object.values(this.events)) {
      if (!handlers.length) continue
      const params = match(path)
      if (params) {
        handlers.forEach(handler => handler.call(this, payload, params))
      }
    }
  }
}
