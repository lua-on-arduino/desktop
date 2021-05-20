import { sep, posix } from 'path'

/**
 * Convert a path to a posix path.
 * @param {string} path
 * @returns
 */
export const pathToPosix = path => path.split(sep).join(posix.sep)
