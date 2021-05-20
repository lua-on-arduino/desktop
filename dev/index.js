import { LuaOnArduino } from '../src/index.js'
import { delay } from '../src/utils/delay.js'

const loa = new LuaOnArduino()

async function main() {
  await loa.connect()
  await delay(100)

  // console.log((await loa.listDirectory('lua'))?.toString())

  loa.syncDirectory('./lua/**/*.*', { watch: true })
}

main()
