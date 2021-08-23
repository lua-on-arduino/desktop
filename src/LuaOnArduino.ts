import SerialPort from 'serialport'
import { Bridge } from './Bridge'
import { EventEmitter } from './EventEmitter'
import { Logger } from './Logger'

export class LuaOnArduino extends EventEmitter {
  logger = new Logger()
  bridge = new Bridge(this.logger)

  constructor() {
    super()

    this.bridge.on('/log/:type', (message, params) =>
      this.logger[params.type]?.(message.args[0])
    )

    this.bridge.on('/raw/log/:type', async (message, params) => {
      const data = await this.bridge.waitForRawData()
      this.logger[params.type]?.(data)
    })
  }

  /**
   * Connect to the device.
   */
  async connect(path: string, openOptions: SerialPort.OpenOptions = {}) {
    try {
      await this.bridge.connect(path, openOptions)
      this.logger.success('connected')
      return true
    } catch (error) {
      this.logger.error(error?.message)
    }
  }

  close() {
    return this.bridge.close()
  }

  /**
   * Read a file from the device's SD card.
   */
  async readFile(fileName: string): Promise<Buffer> {
    try {
      const data = await this.bridge.sendRequest('/read-file', fileName)
      return data
    } catch (error) {
      this.logger.error(
        `Error reading file ${fileName}${error ? ` (${error})` : ''}.`
      )
    }
  }
}
