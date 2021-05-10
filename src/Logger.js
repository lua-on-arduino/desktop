// @ts-check

import chalk from 'chalk'

export class Logger {
  prefix = chalk.blue('[Loa] ')

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
}
