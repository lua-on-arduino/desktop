import { sep, posix } from 'path'

/**
 * Convert a path to a posix path.
 */
export const pathToPosix = (path: string) => path.split(sep).join(posix.sep)
