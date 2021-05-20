// @ts-check

import { EventEmitter } from './EventEmitter.js'
import { Logger } from './Logger.js'
import { Bridge } from './Bridge.js'
import path from 'path'
import chokidar from 'chokidar'
import { promises as fs } from 'fs'
import { delay, pathToPosix } from './utils/index.js'

export class LuaOnArduino extends EventEmitter {
  logger = new Logger()
  bridge = new Bridge(this.logger)

  constructor() {
    super()

    this.bridge.on('/raw/**', () => this.bridge.expectRawData())
    this.bridge.on('/log/:type', (message, params) =>
      this.logger[params.type]?.(message.args[0])
    )
    this.bridge.on('/raw/log/:type', async (message, params) => {
      const data = await this.bridge.waitForRawData()
      this.logger[params.type]?.(data)
    })
  }

  async connect() {
    try {
      await this.bridge.connect('COM4')
      this.logger.success('connected')
    } catch (error) {
      this.logger.error(error?.message)
    }
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

    // For some reasons, when writing two files directly after one another,
    // sometimes the serial input on the device doesn't switch to raw mode fast
    // enough and is therefore ignoring the file content, writing an empty file.
    // A small delay seems to help, although this is quite hacky workaround...
    // TODO: Find out what the problem really is.
    await delay(50)
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
   * Re-run a lua file on the device. Use hot module replacement if possible,
   * otherwise reload the lua program.
   * @param {string} fileName
   */
  async updateFile(fileName) {
    try {
      const usedHmr = await this.bridge.sendRequest(
        '/lua/update-file',
        fileName
      )
      const type = usedHmr ? 'hmr' : 'reload'
      this.logger.success(`update file (${type})`, fileName)
    } catch (error) {
      this.logger.error(`Couldn't update file ${fileName}.`)
    }
  }

  /**
   * Run a file on the device.
   * @param {*} fileName
   */
  async runFile(fileName) {
    try {
      await this.bridge.sendRequest('/lua/run-file', fileName)
      this.logger.success('run file', fileName)
    } catch (error) {
      this.logger.error(
        `Couldn't run file ${fileName}${error ? ` (${error})` : ''}.`
      )
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
   * Sync a directory to the device.
   * @param {string} dir The directory on the computer.
   * @returns {Promise<chokidar.FSWatcher>}
   */
  syncDirectory(dir, { watch = false } = {}) {
    const watcher = chokidar.watch(dir)

    // We can only send one file at a time, so we have to make a list with all
    // the initial files first and send them later one after the other.
    const initialList = []
    /** @param {string} path */
    const addToInitialList = path => initialList.push(path)
    watcher.on('add', addToInitialList)

    return new Promise(resolve => {
      watcher.on('ready', async () => {
        for (const path of initialList) {
          await this.writeFile(pathToPosix(path), await fs.readFile(path))
        }
        watcher.off('add', addToInitialList)

        // We handled the initial files and can now register our change handler.
        watcher.on('change', async path => {
          const posixPath = pathToPosix(path)
          this.writeFile(posixPath, await fs.readFile(path))
          await delay(100)
          this.updateFile(posixPath)
        })

        // Because we don't use `ignoreInitial` all files have been transferred
        // now and we can close the watcher again.
        if (!watch) watcher.close()
        resolve(watcher)
      })
    })
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
