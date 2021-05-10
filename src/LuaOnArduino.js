// @ts-check

import { slipDecode } from './utils/index.js'
import { EventEmitter } from './EventEmitter.js'
import { Logger } from './Logger.js'
import { Bridge } from './Bridge.js'
import OSC from 'osc-js'

const RESPONSE_TIMEOUT = 1000 // ms

export class LuaOnArduino extends EventEmitter {
  logger = new Logger()
  bridge = new Bridge(this.logger, {
    /** @param {Buffer} data */
    onOscData: data => this._handleOscData(data),
    /** @param {Buffer} data */
    onRawData: data => this._handleRawData(data),
  })

  constructor() {
    super()
    this.bridge.connect('COM4')

    this.on('/raw/**', () => this.bridge.listenForRawData())
    this.on('/log/:type', (message, params) =>
      this.logger[params.type]?.(message.args[0])
    )
    this.on('/raw/log/:type', (message, params) =>
      this.logger[params.type]?.(message.args[0])
    )
  }

  /**
   * @param {string} path
   * @param {any | Array<any>} args
   */
  sendMessage(path, args) {
    this.bridge.sendMessage(path, args)
  }

  /**
   * Read a file from the device's SD card.
   * @param {string} fileName
   * @returns {Promise<Buffer>}
   */
  async readFile(fileName) {
    this.sendMessage('/read-file', fileName)

    let data
    try {
      data = this.waitForRawData()
    } catch (error) {
      this.logger.error(`Couldn't read file '${fileName}'.`)
    }
    return data
  }

  /**
   * Write a file to the device's SD card.
   * @param {string} fileName
   * @param {Buffer | ArrayBuffer} data
   * @returns
   */
  async writeFile(fileName, data) {
    const buffer = data instanceof Buffer ? data : Buffer.from(data)
    this.sendMessage('/file', fileName)
    this.bridge.sendRaw(buffer)

    let success = false
    try {
      success = !!(await this.waitForMessage('/success/file'))
      this.logger.success('write file', fileName)
    } catch (error) {
      this.logger.error(`Couldn't write file '${fileName}'.`)
    }
    return success
  }

  /**
   * Wait for a specific message from the device.
   * @async
   * @param {string} path
   * @returns {Promise<{payload: any, params: object}>}
   */
  waitForMessage(path) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(reject, RESPONSE_TIMEOUT)
      this.once(path, (payload, params) => {
        clearTimeout(timeout)
        resolve({ payload, params })
      })
    })
  }

  async waitForRawData() {
    let data = null
    try {
      data = (await this.waitForMessage('/raw-data')).payload
    } catch (error) {}
    return data
  }

  /** @param {Buffer} data */
  _handleOscData(data) {
    const decodedData = slipDecode(data)
    // @ts-ignore (osc-js doesn't provide types)
    const message = new OSC.Message()
    try {
      // ? Is all this conversion necessary?
      message.unpack(new DataView(new Uint8Array(decodedData).buffer))
      this.emit(message.address, message)
    } catch (error) {
      console.log(data.toString())
    }
  }

  /** @param {Buffer} data */
  _handleRawData(data) {
    const decodedData = slipDecode(data)
    this.emit('/raw-data', decodedData)
  }
}
