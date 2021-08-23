import { LuaOnArduino } from './LuaOnArduino'
;(async () => {
  const loa = new LuaOnArduino()
  await loa.connect('COM4')
  await loa.writeFile('lua/my-test.lua', Buffer.from(`print('hallo!')`))
  await loa.runFile('lua/my-test.lua')
  loa.close()
})()
