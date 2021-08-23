import { sep } from 'path'

function check(list: any, level: any, ...rest: string[]): boolean {
  for (const entry of list) {
    if (Array.isArray(entry)) {
      const [dir, files] = entry
      if (dir === level) return dirIncludes(files, rest[0])
    } else {
      if (entry === level) return true
    }
  }
  return false
}

export const dirIncludes = (list: any, path: string) => {
  const parts = path.split(sep)
  const first = parts.shift()
  return check(list, first, ...parts)
}
