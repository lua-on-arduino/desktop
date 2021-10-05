import path from 'path'
import chokidar from 'chokidar'
import { promises as fs } from 'fs'
import type SerialPort from 'serialport'
import { relative } from 'path'
import { pathToPosix, dirIncludes } from './utils/index'
import AsyncOsc from 'async-osc'
import NodeSerialTransport from 'async-osc/dist/NodeSerialTransport.js'
import { Logger } from './Logger'

type FileEntry = string
type DirectoryEntry = [string, Array<FileEntry | DirectoryEntry>]
export type DirectoryList = Array<FileEntry | DirectoryEntry>

export class LuaOnArduino {
  logger = new Logger()
  osc = new AsyncOsc(new NodeSerialTransport())

  constructor() {
    this.osc.on('/log/:type', (message, params) =>
      // @ts-ignore
      this.logger[params.type]?.(message.args[0])
    )

    this.osc.on('/raw/log/:type', async (_message, params) => {
      const data = await this.osc.waitForRawData()
      // @ts-ignore
      this.logger[params.type]?.(data)
    })

    // Handle uncategorized serial output from the device.
    this.osc.on('/data/unknown', (data: Uint8Array) =>
      this.logger.print(Buffer.from(data).toString())
    )
  }

  /**
   * Connect to the device.
   */
  async connect(path: string, options: SerialPort.OpenOptions = {}) {
    try {
      await this.osc.connect({ path, ...options })
      this.logger.success('connected')
      return true
    } catch (error) {
      this.logger.error(error?.message)
    }
  }

  close() {
    return this.osc.close()
  }

  /**
   * Read a file from the device's SD card.
   */
  async readFile(fileName: string): Promise<Buffer | null> {
    try {
      const data = await this.osc.sendRequest('/read-file', fileName)
      return Buffer.from(data)
    } catch (error) {
      this.logger.error(
        `Error reading file ${fileName}${error ? ` (${error})` : ''}.`
      )
      return null
    }
  }

  /**
   * Write a file to the device's SD card.
   */
  async writeFile(
    fileName: string,
    data: Buffer | ArrayBuffer,
    logSuccess = true
  ) {
    const buffer = data instanceof Buffer ? data : Buffer.from(data)
    try {
      await this.osc.sendRawRequest(
        '/write-file',
        [path.dirname(fileName), path.basename(fileName)],
        buffer
      )
      logSuccess && this.logger.success('write file', fileName)
      return true
    } catch (error) {
      this.logger.error(`Couldn't write file ${fileName}.`, error)
      return false
    }
  }

  /**
   * Delete a file from the device's SD card.
   */
  async deleteFile(fileName: string) {
    try {
      await this.osc.sendRequest('/delete-file', fileName)
      this.logger.success('delete file', fileName)
    } catch (error) {
      this.logger.error(`Couldn't delete file ${fileName}.`, error)
    }
  }

  /**
   * Return a list a of all files inside a directory on the device's SD card.
   */
  async readDirectory(dirName: string) {
    try {
      return JSON.parse(
        (await this.osc.sendRequest('/list-dir', dirName)).toString()
      )
    } catch (error) {
      this.logger.error(error?.message)
    }
  }

  /**
   * Create a directory on the device's SD card.
   */
  async createDirectory(dirName: string): Promise<boolean> {
    try {
      await this.osc.sendRequest('/create-dir', dirName)
      this.logger.success('create directory', dirName)
      return true
    } catch (error) {
      this.logger.error(`Couldn't create directory ${dirName}.`, error)
      return false
    }
  }

  /**
   * Delete a directory on the device's SD card.
   */
  async deleteDirectory(dirName: string) {
    try {
      await this.osc.sendRequest('/delete-dir', dirName)
      this.logger.success('delete directory', dirName)
      return true
    } catch (error) {
      this.logger.error(`Couldn't delete directory ${dirName}.`, error)
      return false
    }
  }

  /**
   * Run a file on the device.
   */
  async runFile(fileName: string): Promise<boolean> {
    try {
      await this.osc.sendRequest('/lua/run-file', fileName)
      this.logger.success('run file', fileName)
      return true
    } catch (error) {
      this.logger.error(`Couldn't run file ${fileName}`, error)
      return false
    }
  }

  /**
   * Re-run a lua file on the device. Use hot module replacement if possible,
   * otherwise reload the lua program.
   */
  async updateFile(fileName: string): Promise<boolean> {
    try {
      const usedHmr = await this.osc.sendRequest('/lua/update-file', fileName)
      const type = usedHmr ? 'hmr update' : 'reload'
      this.logger.success(type, fileName)
      return true
    } catch (error) {
      this.logger.error(`Couldn't update file ${fileName}.`, error)
      return false
    }
  }

  /**
   * Sync files to the device.
   */
  async syncFiles(
    pattern: string,
    { watch = false, override = true } = {}
  ): Promise<chokidar.FSWatcher> {
    this.logger.info(`sync files ${pattern}`)
    const dir = await this.readDirectory('lua')

    const syncFile = async (path: string, update = true) => {
      const posixPath = pathToPosix(path)
      // As `updateFile()` also logs a success message we can omit the
      // `writeFile()` success.
      const logSuccess = !update
      this.writeFile(posixPath, await fs.readFile(path), logSuccess)
      update && this.updateFile(posixPath)
    }

    const handleInitialAdd = (path: string) => {
      if (override || !dirIncludes(dir, relative('lua/', path)))
        syncFile(path, false)
    }

    return new Promise(resolve => {
      const watcher = chokidar.watch(pattern)
      watcher.on('add', handleInitialAdd)
      watcher.on('ready', async () => {
        watcher.off('add', handleInitialAdd)
        watcher.on('change', syncFile)
        if (!watch) watcher.close()
        resolve(watcher)
      })
    })
  }
}
