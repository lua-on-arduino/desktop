// !NOTE: an arduino device running the lua-on-arduino firmware must be
// !connected to run these tests.

import { describe, expect, jest, it } from '@jest/globals'
import LuaOnArduino from '../src/index.js'

let loa

beforeEach(async () => (loa = new LuaOnArduino()))

afterEach(async () => await loa.destroy)

describe('LuaOnArduino', () => {
  it('connects to the device', async () => {
    expect(await loa.connect()).toBeTruthy()
  })

  it('writes (and creates) a file on the device', async () => {
    await loa.connect()
    expect(await loa.writeFile('lua/__test.lua', 'content')).toBeTruthy()
    await loa.deleteFile('lua/__test.lua')
  })
})
