import { expect, jest, it, test } from '@jest/globals'
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
    let handler = jest.fn()

    eventEmitter.on('/test/*/test', handler)
    eventEmitter.emit('/test/foo/test')
    expect(handler).toBeCalled()

    eventEmitter.on('/*', handler)
    eventEmitter.emit('/test')
    expect(handler).toBeCalled()
  })
})
