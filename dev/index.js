// @ts-check

import { LuaOnArduino } from '../src/index.js'

const loa = new LuaOnArduino()

async function main() {
  await loa.connect()

  loa.syncFiles('./lua/**/*.*', { watch: true })
}

main()
