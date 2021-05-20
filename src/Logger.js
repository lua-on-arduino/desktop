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
   * Log a warning to the console.
   * @param {string} text
   */
  info(text) {
    console.log(this.prefix + chalk.gray(text))
  }

  /**
   * Log a warning to the console.
   * @param {string} text
   */
  warning(text) {
    console.log(this.prefix + chalk.yellow(text))
  }

  /**
   * Log a warning to the console.
   * @param {string} text
   */
  error(text) {
    console.log(this.prefix + chalk.red(text))
  }

  /**
   * Log a warning to the console.
   * @param {string} type
   * @param {string} [text]
   */
  success(type, text) {
    console.log(
      this.prefix + chalk.green(type) + (text ? ` ${chalk.gray(text)}` : '')
    )
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
