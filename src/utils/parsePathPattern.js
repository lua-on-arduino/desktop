// @ts-check

/**
 * Return a match function for the specified path pattern.
 * @param {string} pattern
 */
export const parsePathPattern = pattern => {
  // Handle url params like `/path/:param`
  const keys = pattern.match(/(:[^/]+)/g)?.map(name => name.substr(1))
  pattern = pattern.replace(/(:[^/]+)/g, '([^/]+)')

  // Handle `*` and `**` wildcard
  pattern = pattern.replace(/\/\*(\/|$)/g, '[^/]+')
  pattern = pattern.replace(/\/\*\*(\/|$)/g, '.*')

  const regExp = new RegExp(`^${pattern}$`)

  /** @param {RegExpMatchArray} match */
  const getParams = match => {
    if (!keys) return !!match
    if (!match) return false

    /** @type {Record<string, string>} */
    const params = {}
    keys.forEach(
      // The first element in `match` contains the whole string so we have to
      // offset the index by 1.
      (key, index) => (params[key] = match[index + 1])
    )
    return params
  }

  /**
   * @param {string} path
   * @returns {boolean | Record<string, string>} False if the path doesn't match
   * true or the parameters (if there are any) if the path matches.
   */
  const match = path => path && getParams(path.match(regExp))
  return match
}
