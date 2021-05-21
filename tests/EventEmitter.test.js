import { expect, jest, it } from '@jest/globals'
import { EventEmitter } from '../src/EventEmitter'

describe('EventEmitter', () => {
  it('adds a new event listener and calls it', () => {
    const eventEmitter = new EventEmitter()
    const handler = jest.fn()
    eventEmitter.on('/test', handler)
    eventEmitter.emit('/test')
    expect(handler).toBeCalled()
  })

  it('removes an event listener', () => {
    const eventEmitter = new EventEmitter()
    const handler = jest.fn()
    eventEmitter.on('/test', handler)
    eventEmitter.off('/test', handler)
    eventEmitter.emit('/test')
    expect(handler).not.toBeCalled()
  })

  it('passes payload and parameters to event handlers', () => {
    const eventEmitter = new EventEmitter()
    const handler = jest.fn()
    const payload = 'payload'
    eventEmitter.on('/test/:param', handler)
    eventEmitter.emit('/test/paramValue', payload)
    expect(handler).toBeCalledWith(payload, { param: 'paramValue' })
  })

  it('handles wildcards in event paths', () => {
    const eventEmitter = new EventEmitter()

    const handler1 = jest.fn()
    eventEmitter.on('/test/*/test', handler1)
    eventEmitter.emit('/test/foo/test')
    expect(handler1).toBeCalled()

    const handler2 = jest.fn()
    eventEmitter.on('/*', handler2)
    eventEmitter.emit('/test')
    expect(handler2).toBeCalled()

    const handler3 = jest.fn()
    eventEmitter.on('/test/**', handler3)
    eventEmitter.emit('/test/foo/bar')
    expect(handler3).toBeCalled()
  })
})
