// @ts-check

import { slipEncode } from './utils/index.js'
import SerialPort from 'serialport'
import Delimiter from '@serialport/parser-delimiter'
import OSC from 'osc-js'
import { EventEmitter } from './EventEmitter.js'
import { Logger } from './Logger.js'

const SLIP_END = 0xc0

export class Bridge extends EventEmitter {
  /** @type {SerialPort} */
  port

  /** @type {'osc' | 'raw'} */
  serialReadMode = 'osc'

  /** @param {Logger} logger */
  constructor(logger, { onOscData, onRawData }) {
    super()
    this.logger = logger
    this.onOscData = onOscData
    this.onRawData = onRawData
  }

  /**
   * Connect to the device.
   * @param {string} path
   * @param {SerialPort.OpenOptions} openOptions
   */
  connect(path, openOptions = {}) {
    this.port = new SerialPort(
      path,
      { baudRate: 9600, ...openOptions },
      error => {
        if (error) this.logger.error(error.message)
        else this.logger.success('connected')
      }
    )

    const parser = new Delimiter({ delimiter: [SLIP_END] })
    parser.on('data', data => this._handleData(data))
    this.port.pipe(parser)
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
    // @ts-ignore (osc-js doesn't provide types)
    const message = new OSC.Message(path, ...argsArray)
    const buffer = Buffer.from(message.pack())
    this.sendRaw(buffer)
  }

  listenForRawData() {
    this.serialReadMode = 'raw'
  }

  /** @param {Buffer} data */
  _handleData(data) {
    if (this.serialReadMode === 'osc') {
      this.onOscData?.(data)
    } else if (this.serialReadMode === 'raw') {
      this.onRawData?.(data)
      // After we've received the raw data we switch back to osc mode.
      this.serialReadMode = 'osc'
    }
  }
}
