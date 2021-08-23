export type PathParams = Record<string, string>

/**
 * Return a match function for the specified path pattern.
 */
export const parsePathPattern = (pattern: string) => {
  // Handle url params like `/path/:param`.
  const keys = pattern.match(/(:[^/]+)/g)?.map(name => name.substr(1))
  pattern = pattern.replace(/(:[^/]+)/g, '([^/]+)')

  // Handle `*` and `**` wildcard.
  pattern = pattern.replace(/\/\*(\/|$)/g, '/[^/]+/?')
  pattern = pattern.replace(/\/\*\*(\/|$)/g, '/.*/?')

  const regExp = new RegExp(`^${pattern}$`)

  const getParams = (match: RegExpMatchArray) => {
    if (!match) return null
    if (!keys) return {}

    const params: PathParams = {}
    keys.forEach(
      // The first element in `match` contains the whole string so we have to
      // offset the index by 1.
      (key, index) => (params[key] = match[index + 1])
    )
    return params
  }

  /**
   * @returns False if the path doesn't match
   * true or the parameters (if there are any) if the path matches.
   */
  const match = (path: string): PathParams =>
    !path ? null : getParams(path.match(regExp))

  return match
}
