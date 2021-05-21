// @ts-check

import { EventEmitter } from './EventEmitter.js'
import { Logger } from './Logger.js'
import { Bridge } from './Bridge.js'
import path, { relative, sep } from 'path'
import chokidar from 'chokidar'
import { promises as fs } from 'fs'
import { pathToPosix, dirListIncludes } from './utils/index.js'

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

  async connect() {
    try {
      await this.bridge.connect('COM4')
      this.logger.success('connected')
      return true
    } catch (error) {
      this.logger.error(error?.message)
    }
  }

  destroy() {
    return this.bridge.close()
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
  async writeFile(fileName, data, logSuccess = true) {
    const buffer = data instanceof Buffer ? data : Buffer.from(data)
    let success = false

    try {
      success = !!(await this.bridge.sendRawRequest(
        '/write-file',
        [path.dirname(fileName), path.basename(fileName)],
        buffer
      ))
      logSuccess && this.logger.success('write file', fileName)
    } catch (error) {
      this.logger.error(`Couldn't write file ${fileName}.`, error)
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
      this.logger.error(`Couldn't delete file ${fileName}.`, error)
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
      const type = usedHmr ? 'hmr update' : 'reload'
      this.logger.success(type, fileName)
    } catch (error) {
      this.logger.error(`Couldn't update file ${fileName}.`, error)
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
      this.logger.error(`Couldn't run file ${fileName}`, error)
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
      this.logger.error(`Couldn't create directory ${dirName}.`, error)
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
      this.logger.error(`Couldn't delete directory ${dirName}.`, error)
    }
  }

  /**
   * Sync files to the device.
   * @param {string} pattern The files to sync.
   * @returns {Promise<chokidar.FSWatcher>}
   */
  async syncFiles(pattern, { watch = false, override = false } = {}) {
    const watcher = chokidar.watch(pattern)

    this.logger.info(`sync files ${pattern}`)

    const syncFile =
      /** @param {string} path */
      async (path, update = true) => {
        const posixPath = pathToPosix(path)
        // As `updateFile()` also logs a success message we can omit the
        // `writeFile()` success.
        const logSuccess = !update
        this.writeFile(posixPath, await fs.readFile(path), logSuccess)
        update && this.updateFile(posixPath)
      }

    const dirList = await this.listDirectory('lua')

    const handleInitialAdd = /** @param {string} path */ path => {
      if (override || !dirListIncludes(dirList, relative('lua/', path)))
        syncFile(path, false)
    }

    watcher.on('add', handleInitialAdd)

    return new Promise(resolve => {
      watcher.on('ready', async () => {
        watcher.off('add', handleInitialAdd)
        watcher.on('change', syncFile)
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
      list = JSON.parse(
        (await this.bridge.sendRequest('/list-dir', dirName)).toString()
      )
    } catch (error) {
      this.logger.error(error?.message)
    }

    return list
  }
}
