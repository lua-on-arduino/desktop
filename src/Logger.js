// @ts-check

import chalk from 'chalk'
import { highlightLuaDump } from './utils/highlightLuaDump.js'

export class Logger {
  prefix = chalk.blue('[Loa] ')

  /**
   * Print text to the console.
   * @param {string} text
   */
  print(text) {
    // Lua's `print()` seems to always add a line break at the end, but since
    // `console.log()` does the same, we can get rid of it.
    console.log(this.prefix + text.replace(/(\r\n|\n|\r)$/, ''))
  }

  /**
   * Log an info to the console.
   * @param {string} text
   * @param {string} [detail]
   */
  info(text, detail) {
    detail = detail ? ` (${detail})` : ''
    console.log(this.prefix + chalk.gray(text + detail))
  }

  /**
   * Log a warning to the console.
   * @param {string} text
   * @param {string} [detail]
   */
  warning(text, detail) {
    detail = detail ? ` (${detail})` : ''
    console.log(this.prefix + chalk.yellow(text + detail))
  }

  /**
   * Log an error to the console.
   * @param {string} text
   * @param {string} [detail]
   */
  error(text, detail) {
    detail = detail ? ` (${detail})` : ''
    console.log(this.prefix + chalk.red(text + detail))
  }

  /**
   * Log a success message to the console.
   * @param {string} text
   * @param {string} [detail]
   */
  success(text, detail) {
    detail = detail ? ` ${chalk.gray(detail)}` : ''
    console.log(this.prefix + chalk.green(text) + detail)
  }

  /**
   * Dump a lua value to the console.
   * @param {string} jsonString
   */
  dump(jsonString) {
    let json
    try {
      json = JSON.parse(jsonString)
    } catch (error) {
      this.warning(`Dump from lua isn't valid JSON: '${jsonString}'`)
    }
    console.log(highlightLuaDump(json))
  }
}
