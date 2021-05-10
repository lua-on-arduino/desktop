import { LuaOnArduino } from '../src/index.js'

const loa = new LuaOnArduino()

async function main() {
  await loa.writeFile('lua/test.lua', 'yes :)')
  console.log((await loa.readFile('lua/test.lua'))?.toString())
}

main()
