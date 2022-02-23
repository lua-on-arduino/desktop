import type SerialPort from 'serialport'
import { pathToPosix, dirname, basename } from './utils/index'
import AsyncOsc from 'async-osc'
import type { AsyncOscTransport } from 'async-osc'
import { Logger } from './logger'

type FileEntry = string
type DirectoryEntry = [string, Array<FileEntry | DirectoryEntry>]
export type DirectoryList = Array<FileEntry | DirectoryEntry>

export class LuaOnArduino {
  logger = new Logger()
  osc: AsyncOsc

  constructor(transport: AsyncOscTransport, { debug = false } = {}) {
    this.osc = new AsyncOsc(transport)

    if (debug) {
      this.osc.on('/data/dev', (data: Uint8Array) =>
        console.log(new TextDecoder().decode(data))
      )
    }

    this.osc.on('/log/:type', (message: Object, params: Record<string, any>) =>
      // @ts-ignore
      this.logger[params.type]?.(message.args[0])
    )

    this.osc.on(
      '/raw/log/:type',
      async (_message: Object, params: Record<string, any>) => {
        const data = await this.osc.waitForRawData()
        // @ts-ignore
        this.logger[params.type]?.(new TextDecoder().decode(data))
      }
    )

    // Handle uncategorized serial output from the device.
    this.osc.on('/data/unknown', (data: Uint8Array) =>
      this.logger.print(new TextDecoder().decode(data))
    )
  }

  /**
   * Connect to the device.
   */
  async connect(options?: any) {
    try {
      await this.osc.connect(options)
      this.logger.success('connected')
      return true
    } catch (error) {
      this.logger.error((error as Error)?.message)
    }
  }

  close() {
    return this.osc.close()
  }

  /**
   * Read a file from the device's SD card.
   */
  async readFile(fileName: string): Promise<Uint8Array | null> {
    try {
      return await this.osc.sendRequest('/read-file', fileName)
    } catch (error) {
      this.logger.error(
        `Error reading file ${fileName}.`,
        (error as Error)?.message
      )
      return null
    }
  }

  /**
   * Write a file to the device's SD card.
   */
  async writeFile(fileName: string, data: Uint8Array, logSuccess = true) {
    fileName = pathToPosix(fileName)

    try {
      await this.osc.sendRawRequest(
        '/write-file',
        [dirname(fileName), basename(fileName)],
        data
      )
      logSuccess && this.logger.success('write file', fileName)
      return true
    } catch (error) {
      this.logger.error(
        `Couldn't write file ${fileName}.`,
        (error as Error)?.message
      )
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
      return true
    } catch (error) {
      this.logger.error(
        `Couldn't delete file ${fileName}.`,
        (error as Error)?.message
      )
    }
  }

  /**
   * Return a list a of all files inside a directory on the device's SD card.
   */
  async readDirectory(dirName: string) {
    try {
      return JSON.parse(
        new TextDecoder().decode(
          await this.osc.sendRequest('/list-dir', dirName)
        )
      )
    } catch (error) {
      this.logger.error((error as Error)?.message)
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
      this.logger.error(
        `Couldn't create directory ${dirName}.`,
        (error as Error)?.message
      )
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
      this.logger.error(
        `Couldn't delete directory ${dirName}.`,
        (error as Error)?.message
      )
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
      this.logger.error(
        `Couldn't run file ${fileName}`,
        (error as Error)?.message
      )
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
      this.logger.error(
        `Couldn't update file ${fileName}.`,
        (error as Error)?.message
      )
      return false
    }
  }
}
