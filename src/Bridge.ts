import SerialPort from 'serialport'
import { getMessageId, startsWith } from './utils/index'
import { SlipDecoder, SlipEncoder } from '@serialport/parser-slip-encoder'
import { Logger } from './Logger'
import { EventEmitter, EventEmitterParams } from './EventEmitter'
import OSC from 'osc-js'

export type SerialReadMode = 'osc' | 'raw'

export interface Message {
  address: string
  args: any[]
}

const RESPONSE_TIMEOUT = 1000 // ms

export class Bridge extends EventEmitter {
  port: SerialPort
  serialReadMode: SerialReadMode = 'osc'
  encoder: SlipEncoder

  constructor(public logger: Logger) {
    super()
    this.on('/raw/**', () => this.#expectRawData())
  }

  connect(path: string, openOptions: SerialPort.OpenOptions = {}) {
    this.port = new SerialPort(path, {
      baudRate: 9600,
      ...openOptions,
      autoOpen: false,
    })

    const decoder = new SlipDecoder()
    decoder.on('data', (data: Buffer) => this.#handleData(data))
    this.port.pipe(decoder)

    this.encoder = new SlipEncoder()
    this.encoder.pipe(this.port)

    this.port.on('close', () => this.logger.error('disconnected'))

    return new Promise<void>((resolve, reject) => {
      this.port.open(error => {
        if (error) {
          reject(error)
        } else {
          resolve()
        }
      })
    })
  }

  close() {
    return new Promise<void>((resolve, reject) => {
      this.port.close(error => {
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
   */
  sendRaw(data: Buffer) {
    this.encoder.write(data, (error: Error) => {
      if (error) this.logger.error(error.message)
    })
  }

  /**
   * Send an OSC message to the device.
   * @returns The message id.
   */
  sendMessage(path: string, args: any | Array<any>) {
    const argsArray = Array.isArray(args) ? args : [args]
    const id = getMessageId()
    // @ts-ignore (osc-js doesn't provide types)
    const message = new OSC.Message(path, id, ...argsArray)
    const buffer = Buffer.from(message.pack())
    this.sendRaw(buffer)
    return id
  }

  /**
   * Send an OSC message to the device and expect a response.
   */
  sendRequest(path: string, args: any | Array<any>): Promise<any> {
    const id = this.sendMessage(path, args)
    return this.waitForResponse(id)
  }

  /**
   * Send an OSC message, followed by raw data and expect a response.
   * For example we could send a `save-file` message, followed by the raw
   * content of the file and expect a response wether or not the file could be
   * saved.
   */
  sendRawRequest(path: string, args: any, data: Buffer) {
    const id = this.sendMessage(path, args)
    this.sendRaw(data)
    return this.waitForResponse(id)
  }

  /**
   * Wait for a message with a specific path.
   */
  waitForMessage(path: string): Promise<{ payload: any; params: object }> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(reject, RESPONSE_TIMEOUT)
      this.once(path, (payload, params) => {
        clearTimeout(timeout)
        resolve({ payload, params })
      })
    })
  }

  /**
   * Wait for a response.
   */
  waitForResponse(id: number): Promise<{ payload: any }> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => reject('response timeout'),
        RESPONSE_TIMEOUT
      )

      const handler: (
        message: Message,
        params: EventEmitterParams
      ) => Promise<void> = async (message, params) => {
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

  /**
   * Wait for raw data.
   */
  async waitForRawData() {
    let data = null
    try {
      data = (await this.waitForMessage('/raw-data')).payload
    } catch (error) {}
    return data
  }

  #expectRawData() {
    this.serialReadMode = 'raw'
  }

  #handleData(data: Buffer) {
    if (this.serialReadMode === 'osc') {
      this.#handleOscData(data)
    } else if (this.serialReadMode === 'raw') {
      this.#handleRawData(data)
      // After we've received the raw data we switch back to osc mode.
      this.serialReadMode = 'osc'
    }
  }

  #handleOscData(data: Buffer) {
    const decodedData = data //slipDecode(data)
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

  #handleRawData(data: Buffer) {
    // console.log(`raw: ${data.toString()}`)
    const decodedData = data //slipDecode(data)
    this.emit('/raw-data', decodedData)
  }
}
