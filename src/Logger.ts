import pico from 'picocolors'
import { highlightLuaDump } from './utils/highlightLuaDump'

export class Logger {
  prefix = pico.blue('[Loa] ')

  /**
   * Print text to the console.
   */
  print(text: string) {
    // Lua's `print()` seems to always add a line break at the end, but since
    // `console.log()` does the same, we can get rid of it.
    console.log(this.prefix + text.replace(/(\r\n|\n|\r)$/, ''))
  }

  /**
   * Log an info to the console.
   */
  info(text: string, detail?: string) {
    detail = detail ? ` (${detail})` : ''
    console.log(this.prefix + pico.gray(text + detail))
  }

  /**
   * Log a warning to the console.
   */
  warn(text: string, detail?: string) {
    detail = detail ? ` (${detail})` : ''
    console.log(this.prefix + pico.yellow(text + detail))
  }

  /**
   * Log an error to the console.
   */
  error(text: string, detail?: string) {
    detail = detail ? ` (${detail})` : ''
    console.log(this.prefix + pico.red(text + detail))
  }

  /**
   * Log a success message to the console.
   */
  success(text: string, detail?: string) {
    detail = detail ? ` ${pico.gray(detail)}` : ''
    console.log(this.prefix + pico.green(text) + detail)
  }

  /**
   * Dump a lua value to the console.
   */
  dump(jsonString: string) {
    let json = []
    try {
      json = JSON.parse(jsonString)
    } catch (error) {
      this.warn(`Dump from lua isn't valid JSON: '${jsonString}'`)
    }
    console.log(highlightLuaDump(json))
  }
}
