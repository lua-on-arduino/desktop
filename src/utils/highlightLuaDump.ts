import chalk from 'chalk'

const colorize = {
  specialKey: chalk.cyan,
  key: chalk.green,
  complexType: chalk.magenta,
  number: chalk.blue,
  boolean: chalk.blue,
  string: chalk.yellow,
}

const indent = (depth: number) => '  '.repeat(depth)

const trimBrackets = (string: string) => string.slice(1, -1)

const highlightKey = (key: string): string => {
  if (/^(_G|_VERSION)$/.test(key)) {
    // Special global lua key
    return colorize.specialKey(key)
  } else if (/^\[(table|(light)?function)\]$/.test(key)) {
    // Complex data type representation
    return `[${colorize.complexType(trimBrackets(key))}]`
  } else if (/^\[\d+\]$/.test(key)) {
    // Number
    return `[${colorize.number(trimBrackets(key))}]`
  } else if (typeof key === 'string') {
    // String
    return colorize.key(key)
  } else {
    return key
  }
}

const highlightValue = (value: string): string => {
  if (/^(table|(light)?function)$/.test(value)) {
    // Complex data type representation
    return colorize.complexType(value)
  } else if (typeof value === 'number') {
    // Number
    return colorize.number(value)
  } else if (typeof value === 'boolean') {
    // Boolean
    return colorize.boolean(value)
  } else if (/^'.*'$/.test(value)) {
    // String
    return colorize.string(`${value}`)
  } else {
    return value
  }
}

const highlightTable = (obj: object, depth: number = 0): string => {
  const keys = Object.keys(obj)
  if (!keys.length) return '{}'

  let str = '{\n'
  let index = 0
  for (const key of keys.sort()) {
    const value = obj[key]
    const highlightedKey = highlightKey(key)
    const highlightedValue =
      typeof value === 'object'
        ? highlightTable(value, depth + 1)
        : highlightValue(value)

    str += indent(depth + 1) + `${highlightedKey} = ${highlightedValue}`
    str += index < keys.length ? ',\n' : '\n'
    index++
  }
  return str + indent(depth) + '}'
}

/**
 * Highlight and format the dump object from lua for printing it to the console.
 */
export const highlightLuaDump = (dump: Array<any>) =>
  dump
    .map(value =>
      typeof value === 'object' ? highlightTable(value) : highlightValue(value)
    )
    .join('\n')
