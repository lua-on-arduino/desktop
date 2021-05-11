// @ts-check

import { EventEmitter } from './EventEmitter.js'
import { Logger } from './Logger.js'
import { Bridge } from './Bridge.js'
import path from 'path'

export class LuaOnArduino extends EventEmitter {
  logger = new Logger()
  bridge = new Bridge(this.logger)

  constructor() {
    super()
    this.bridge.connect('COM4')

    this.bridge.on('/raw/**', () => this.bridge.expectRawData())
    this.bridge.on('/log/:type', (message, params) =>
      this.logger[params.type]?.(message.args[0])
    )
    this.bridge.on('/raw/log/:type', (message, params) =>
      this.logger[params.type]?.(message.args[0])
    )
  }

  /**
   * Read a file from the device's SD card.
   * @param {string} fileName
   * @returns {Promise<Buffer>}
   */
  async readFile(fileName) {
    let data
    try {
      data = await this.bridge.sendRequest('/read-file', fileName)
    } catch (error) {
      this.logger.error(
        `Error reading file ${fileName}${error ? ` (${error})` : ''}.`
      )
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
    let success = false

    try {
      success = !!(await this.bridge.sendRawRequest(
        '/write-file',
        [path.dirname(fileName), path.basename(fileName)],
        buffer
      ))
      this.logger.success('write file', fileName)
    } catch (error) {
      this.logger.error(
        `Couldn't write file ${fileName}${error ? ` (${error})` : ''}.`
      )
    }
    return success
  }

  /**
   * Delete a file from the device's SD card.
   * @param {string} fileName
   */
  async deleteFile(fileName) {
    try {
      await this.bridge.sendRequest('/delete-file', fileName)
      this.logger.success('delete file', fileName)
    } catch (error) {
      this.logger.error(`Couldn't delete file ${fileName}.`)
    }
  }

  /**
   * Create a directory on the device's SD card.
   * @param {string} dirName
   */
  async createDirectory(dirName) {
    try {
      await this.bridge.sendRequest('/create-dir', dirName)
      this.logger.success('create directory', dirName)
    } catch (error) {
      this.logger.error(
        `Couldn't create directory ${dirName}${error ? ` (${error})` : ''}.`
      )
    }
  }

  /**
   * Delete a directory on the device's SD card.
   * @param {string} dirName
   */
  async deleteDirectory(dirName) {
    try {
      await this.bridge.sendRequest('/delete-dir', dirName)
      this.logger.success('delete directory', dirName)
    } catch (error) {
      this.logger.error(
        `Couldn't delete directory ${dirName}${error ? ` (${error})` : ''}.`
      )
    }
  }

  /**
   * List a directory on the device's SD card.
   * @param {string} dirName
   */
  async listDirectory(dirName) {
    let list

    try {
      list = await this.bridge.sendRequest('/list-dir', dirName)
    } catch (error) {
      this.logger.error(error?.message)
    }

    return list
  }
}
