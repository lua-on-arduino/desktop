import { LuaOnArduino } from './LuaOnArduino'
;(async () => {
  const loa = new LuaOnArduino()
  await loa.connect('COM4')
  // await loa.readFile('lua/init.lua')
  // loa.close()

  const delay = time => new Promise(resolve => setTimeout(resolve, time))

  for (let i = 0; i < 2; i++) {
    loa.bridge.sendMessage('/led', 1)
    console.log('high')
    await delay(1000)
    loa.bridge.sendMessage('/led', 0)
    console.log('low')
    await delay(1000)
  }

  loa.close()
})()
