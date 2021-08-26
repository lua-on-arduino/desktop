import { LuaOnArduino } from './LuaOnArduino'

export { LuaOnArduino as default } from './LuaOnArduino'
;(async () => {
  const loa = new LuaOnArduino()
  await loa.connect('COM4')
  const file = await loa.readFile('lua/patches/patch1.lua')
  console.log(file?.toString())
})()
