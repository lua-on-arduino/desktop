// @ts-check

import { slipEncode, slipDecode, startsWith } from './utils/index.js'
import SerialPort from 'serialport'
import Delimiter from '@serialport/parser-delimiter'
import OSC from 'osc-js'
import { EventEmitter } from './EventEmitter.js'
import { Logger } from './Logger.js'

const SLIP_END = 0xc0
const RESPONSE_TIMEOUT = 1000 // ms

let messageId = -1
/**
 * Create a 16bit message id.
 * @returns
 */
const getMessageId = () => {
  messageId++
  if (messageId > 65535) messageId = 0
  return messageId
}

export class Bridge extends EventEmitter {
  /** @type {SerialPort} */
  port

  /** @type {'osc' | 'raw'} */
  serialReadMode = 'osc'

  /** @param {Logger} logger */
  constructor(logger) {
    super()
    this.logger = logger
  }

  /**
   * Connect to the device.
   * @async
   * @param {string} path
   * @param {SerialPort.OpenOptions} openOptions
   */
  connect(path, openOptions = {}) {
    this.port = new SerialPort(path, {
      baudRate: 9600,
      ...openOptions,
      autoOpen: false,
    })

    const parser = new Delimiter({ delimiter: [SLIP_END] })
    parser.on('data', data => this._handleData(data))
    this.port.pipe(parser)

    return new Promise((resolve, reject) => {
      this.port.open(error => {
        if (error) {
          reject(error)
        } else {
          resolve()
        }
      })
    })
  }

  /**
   * Send raw data to the device.
   * @param {Buffer} data
   */
  sendRaw(data) {
    this.port.write(slipEncode(data))
  }

  /**
   * Send an OSC message to the device.
   * @param {string} path
   * @param {any | Array<any>} args
   */
  sendMessage(path, args) {
    const argsArray = Array.isArray(args) ? args : [args]
    const id = getMessageId()
    // @ts-ignore (osc-js doesn't provide types)
    const message = new OSC.Message(path, id, ...argsArray)
    const buffer = Buffer.from(message.pack())
    this.sendRaw(buffer)
    return id
  }

  /**
   * Send an OSC message to the device that expects a response.
   * @async
   * @param {string} path
   * @param {any | Array<any>} args
   * @returns {Promise<any>}
   */
  sendRequest(path, args) {
    const id = this.sendMessage(path, args)
    return this.waitForResponse(id)
  }

  sendRawRequest(path, args, data) {
    const id = this.sendMessage(path, args)
    this.sendRaw(data)
    return this.waitForResponse(id)
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

  /**
   * Wait for a response from the device.
   * @async
   * @param {number} id
   * @returns {Promise<{payload: any}>}
   */
  waitForResponse(id) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => reject('response timeout'),
        RESPONSE_TIMEOUT
      )

      /** @type {(message: object, params: object) => Promise<void>} */
      const handler = async (message, params) => {
        const [responseId, payload] = message.args

        if (responseId === id) {
          this.off('/response/:type', handler)
          this.off('/raw/response/:type', handler)
          clearTimeout(timeout)

          const isRaw = startsWith(message.address, '/raw/')
          const response = isRaw ? await this.waitForRawData() : payload

          if (params.type === 'success') {
            resolve(response)
          } else {
            reject(response)
          }
        }
      }

      this.on('/response/:type', handler)
      this.on('/raw/response/:type', handler)
    })
  }

  expectRawData() {
    this.serialReadMode = 'raw'
  }

  async waitForRawData() {
    let data = null
    try {
      data = (await this.waitForMessage('/raw-data')).payload
    } catch (error) {}
    return data
  }

  /** @param {Buffer} data */
  _handleData(data) {
    // console.log(data.toString())
    if (this.serialReadMode === 'osc') {
      this._handleOscData(data)
    } else if (this.serialReadMode === 'raw') {
      this._handleRawData(data)
      // After we've received the raw data we switch back to osc mode.
      this.serialReadMode = 'osc'
    }
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
      // If the data wasn't an OSC message it's probably just a print output
      // from lua.
      this.logger.print(data.toString())
    }
  }

  /** @param {Buffer} data */
  _handleRawData(data) {
    // console.log(`raw: ${data.toString()}`)
    const decodedData = slipDecode(data)
    this.emit('/raw-data', decodedData)
  }
}
