import LuaOnArduino from '../src/index'

// Use the port for your arduino device.
const port = 'COM4'
let loa: LuaOnArduino

beforeEach(async () => {
  loa = new LuaOnArduino()
  await loa.connect(port)
})

afterEach(async () => {
  await loa.close()
})

describe('LoaOnArduino', () => {
  it('writes a file', async () => {
    const result = await loa.writeFile('lua/test.txt', Buffer.from('test'))
    expect(result).toBeTruthy()
  })

  it('reads a file', async () => {
    const result = await loa.readFile('lua/test.txt')
    expect(result).toEqual(Buffer.from('test'))
  })

  it('removes a file', async () => {
    const result = await loa.deleteFile('lua/test.txt')
    expect(result).toBeTruthy()
  })

  it('creates a directory', async () => {
    const result = await loa.createDirectory('lua/test-dir')
    expect(result).toBeTruthy()
  })

  it('reads a directory', async () => {
    const result = await loa.readDirectory('lua/test-dir')
    expect(result).toEqual([])
  })

  it('deletes a directory', async () => {
    const result = await loa.deleteDirectory('lua/test-dir')
    expect(result).toBeTruthy()
  })

  it('runs a file', async () => {
    await loa.writeFile('lua/test-run.lua', Buffer.from(`print('test run')`))
    const result = await loa.runFile('lua/test-run.lua')
    expect(result).toBeTruthy()
    await loa.deleteFile('lua/test-run.lua')
  })
})
