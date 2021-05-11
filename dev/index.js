import { LuaOnArduino } from '../src/index.js'

const loa = new LuaOnArduino()

async function main() {
  console.log(JSON.parse((await loa.listDirectory('/lua'))?.toString()))
}

main()
